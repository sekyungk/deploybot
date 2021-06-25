import { App } from "@slack/bolt";
import axios from "axios";

const app = new App({
  token: "xoxb-1954069172629-2210441467440-C937rLoBUD9syqAQRiIBM9Xs",
  signingSecret: "68b00f1325c82817afafbdec4e43c0c7",
});

// app.message(/(status )(\D+)/, async ({ context, say }) => {
//   const repo = context.matches[2];

//   const { data: commits } = await axios.get(
//     `http://localhost:3000/repos/${repo}/commits`
//   );

//   await say({
//     attachments: commits.map((commit: any) => ({
//       color: "#558776",
//       blocks: [
//         {
//           type: "section",
//           text: {
//             type: "mrkdwn",
//             text:
//               "`" + commit.sha + "` " + commit.commit.message.split("\n")[0],
//           },
//         },
//         {
//           type: "section",
//           text: {
//             type: "mrkdwn",
//             text: `${commit.deployment ?? " "}`,
//           },
//         },
//       ],
//     })),
//   });
// });

app.message(/(status )(\D+)/, async ({ context, say }) => {
  const repo = context.matches[2];

  const { data: commitsData } = await axios.get(
    `https://api.github.com/repos/sekyungk/${repo}/commits?per_page=5`,
    {
      headers: {
        Authorization: `Bearer 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`,
      },
    }
  );

  const { data: releasesData } = await axios.get(
    `https://api.github.com/repos/sekyungk/${repo}/releases`,
    {
      headers: {
        Authorization: `Bearer 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`,
      },
    }
  );

  const recomposedCommits = commitsData.map((commit: any) => {
    return {
      ...commit,
      releases: releasesData.filter(
        (release: any) => release.target_commitish === commit.sha
      ),
    };
  });

  console.log(recomposedCommits);

  await say({
    attachments: recomposedCommits.map((commit: any) => ({
      color: "#558776",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              "`" + commit.sha + "` " + commit.commit.message.split("\n")[0],
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${
              commit.releases.length > 0
                ? commit.releases
                    .map((release: any) => release.tag_name)
                    ?.toString()
                : " "
            }`,
          },
        },
      ],
    })),
  });
});

app.message(/(deploy )(\D+)( )(\D+)( )(.+)/, async ({ context, say }) => {
  const repo = context.matches[2];
  const environment = context.matches[4];
  const sha = context.matches[6];

  await axios.post(`http://localhost:3000/repos/${repo}/deployment`, {
    environment,
    type: "production",
    sha,
  });

  await say({
    attachments: [
      {
        color: "#f2c744",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Deploying " + "`" + sha + "` " + "to production",
            },
          },
        ],
      },
    ],
  });
});

app.message("help", async ({ say }) => {
  await say({
    attachments: [
      {
        color: "#f2c744",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "`@deploybot status {repo}`",
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "해당 Repository의 default branch의 Limit만큼의 가장 최근 Commit 들을 보여줍니다.",
            },
          },
        ],
      },
    ],
  });
});

(async () => {
  // Start your app
  await app.start(8080);

  console.log("⚡️ Bolt app is running!");
})();
