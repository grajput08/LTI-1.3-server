import db from "../db/config";
const router = require("express").Router();
const path = require("path");

// Requiring Ltijs
const lti = require("ltijs").Provider;

router.get("/audio-records", async (req: any, res: any) => {
  const resources = [
    {
      title: "Audio Record 1",
      duration: "3:45",
      artist: "Artist1",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      title: "Audio Record 2",
      duration: "4:20",
      artist: "Artist2",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      title: "Audio Record 3",
      duration: "2:55",
      artist: "Artist3",
      link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  ];
  return res.send(resources);
});

router.get("/info", async (req: any, res: any) => {
  const token = res.locals.token;
  const context = res.locals.context;

  const info: {
    name?: string;
    email?: string;
    roles?: string[];
  } = {};
  if (token.userInfo) {
    if (token.userInfo.name) info.name = token.userInfo.name;
    if (token.userInfo.email) info.email = token.userInfo.email;
  }
  if (context.roles) info.roles = context.roles;

  return res.send(info);
});

router.post("/submitted", async (req: any, res: any) => {
  try {
    const resource = req.body;
    const token = res.locals.token;

    // Validate that this is a deep linking request
    if (!token || !token.platformContext) {
      return res.status(400).send({
        error: "Invalid token or context",
      });
    }

    // Validate required fields
    if (!resource.title || !resource.artist) {
      return res.status(400).send({
        error: "Missing required fields: title or artist",
      });
    }

    const items = [
      {
        type: "ltiResourceLink",
        title: resource.title,
        text: `Audio Recording Assignment: ${resource.title}`,
        url: token.platformContext.targetLinkUri,
        custom: {
          resource_link_title: resource.link,
          title: resource.title,
          artist: resource.artist || "",
          assignment_type: "audio_recording",
          duration: resource.duration || 1200,
        },
        userInfo: {
          user_id: token.user,
          given_name: token.userInfo.given_name,
          family_name: token.userInfo.family_name,
          name: token.userInfo.name,
          email: token.userInfo.email,
        },
      },
    ];

    try {
      const responseJson = {
        token,
        items,
        resource,
      };

      // Save to database
      const submissionData = {
        userId: token.user,
        title: resource.title,
        artist: resource.artist,
        link: resource.link,
        duration: resource.duration || 1200,
        createdAt: new Date(),
        platformContext: token.platformContext,
        items: items,
      };

      try {
        // Convert duration from "mm:ss" to seconds
        const durationInSeconds = submissionData.duration.includes(":")
          ? submissionData.duration
              .split(":")
              .reduce(
                (acc: number, time: string) => 60 * acc + parseInt(time),
                0
              )
          : submissionData.duration || 1200;

        await db.query(
          "INSERT INTO submissions (userId, title, artist, link, duration, createdAt, platformContext, items) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
            submissionData.userId,
            submissionData.title,
            submissionData.artist,
            submissionData.link,
            durationInSeconds,
            submissionData.createdAt,
            JSON.stringify(submissionData.platformContext),
            JSON.stringify(submissionData.items),
          ]
        );
      } catch (dbError) {
        console.error("Database Error:", dbError);
        return res.status(500).send({
          error: "Failed to save submission to database",
        });
      }

      console.log("Response JSON:", token, items, resource);
      return res.send(responseJson);
    } catch (dlError) {
      console.error("Deep Linking Error:", dlError);
      console.log("Deep Linking Settings:", dlError);
      if (dlError instanceof Error) {
        return res.status(400).send({
          error:
            "This route must be accessed through a deep linking launch from your LMS",
        });
      }
      throw dlError;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Deep Linking Error:", err.message, err);
      return res.status(500).send({ error: err.message });
    }
    return res.status(500).send({ error: "Unknown error occurred" });
  }
});

/**
 * sendGrade
 */
router.post("/grade", async (req: any, res: any) => {
  try {
    const idtoken = res.locals.token; // IdToken
    const score = req.body.grade; // User numeric score sent in the body
    // Creating Grade object
    const gradeObj = {
      userId: idtoken.user,
      scoreGiven: score,
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    };

    console.log("Grade Object:", gradeObj, idtoken);

    // Selecting linetItem ID
    let lineItemId = idtoken.platformContext.endpoint.lineitem; // Attempting to retrieve it from idtoken
    console.log("Line Item ID:", lineItemId);

    if (!lineItemId) {
      const response = await lti.Grade.getLineItems(idtoken, {
        resourceLinkId: true,
      });
      console.log("Response:", response);
      const lineItems = response.lineItems;
      console.log("Line Items:", lineItems);
      if (lineItems.length === 0) {
        // Creating line item if there is none
        console.log("Creating new line item");
        const newLineItem = {
          scoreMaximum: 100,
          label: "Grade",
          tag: "grade",
          resourceLinkId: idtoken.platformContext.resource.id,
        };
        console.log("New Line Item:", newLineItem);
        const lineItem = await lti.Grade.createLineItem(idtoken, newLineItem);
        console.log("Line Item:", lineItem);
        lineItemId = lineItem.id;
        console.log("Line Item ID:", lineItemId);
      } else lineItemId = lineItems[0].id;
    }

    // Sending Grade
    console.log("Sending Grade");
    const responseGrade = await lti.Grade.submitScore(
      idtoken,
      lineItemId,
      gradeObj
    );
    console.log("Response Grade:", responseGrade);
    return res.send("Hello");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log("Grade Error:", err.message, err);
      return res.status(500).send({ error: err.message });
    }
    return res.status(500).send({ error: "An unknown error occurred" });
  }
});

router.get("/submissions", async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const countResult = await db.query("SELECT COUNT(*) FROM submissions");
    const totalItems = parseInt(countResult.rows[0].count);

    const result = await db.query(
      'SELECT * FROM submissions ORDER BY "createdat" DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    // Transform the submissions data
    const formattedSubmissions = result.rows.map((submission) => ({
      id: submission.id,
      user: {
        id: submission.userid,
        name: submission.items[0]?.userInfo?.name || "",
        email: submission.items[0]?.userInfo?.email || "",
        givenName: submission.items[0]?.userInfo?.given_name || "",
        familyName: submission.items[0]?.userInfo?.family_name || "",
      },
      submission: {
        title: submission.title,
        artist: submission.artist,
        link: submission.link,
        duration: {
          seconds: submission.duration,
          formatted: formatDuration(submission.duration),
        },
        createdAt: submission.createdat,
      },
      context: {
        courseTitle: submission.platformcontext?.context?.title || "",
        courseLabel: submission.platformcontext?.context?.label || "",
        roles: submission.platformcontext?.roles || [],
        resourceTitle: submission.platformcontext?.resource?.title || "",
      },
    }));

    return res.send({
      submissions: formattedSubmissions,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).send({ error: "Failed to fetch submissions" });
  }
});

// Helper function to format duration from seconds to mm:ss
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Update the catch-all route to handle the new paths
router.get("*", (req: any, res: any) => {
  const ltik = req.query.ltik;
  const path = req.path;

  // Preserve the original path when redirecting
  res.redirect(`http://localhost:4001${path}${ltik ? `?ltik=${ltik}` : ""}`);
});

export default router;
