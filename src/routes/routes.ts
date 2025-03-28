import db from "../db/config";
const router = require("express").Router();
const path = require("path");

// Requiring Ltijs
const lti = require("ltijs").Provider;

router.get("/resources", async (req: any, res: any) => {
  const resources = [
    {
      title: "Audio Record 1",
      duration: "3:45",
      artist: "Artist1",
      link: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      transcript: {
        "0:04":
          "I'm Rodney, your interactive AI assistant here in the Dreamscape Learn universe, which is home to some fascinating intergalactic creatures like the Mega Rafi alien zoo, part of the Intergalactic Wildlife Sanctuary, is a virtual reality experience where you can explore diverse alien species and their habitats aimed at preserving endangered species across the galaxy.",
      },
    },
    {
      title: "Audio Record 2",
      duration: "4:20",
      artist: "Artist2",
      link: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      transcript: {
        "0:29": "Are you excited to be at GSV?",
        "0:38": "Absolutely.",
        "0:39":
          "It's fantastic to be here at the 2025 ASU GSV summit, sharing the wonders of Dreamscape Learn with everyone.",
      },
    },
    {
      title: "Audio Record 3",
      duration: "2:55",
      artist: "Artist3",
      link: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      transcript: {
        "0:45": "How about you?",
        "0:46": "Are you having a great time at the event?",
      },
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

router.post("/submit/audio", async (req: any, res: any) => {
  try {
    const resource = req.body;
    const token = res.locals.token;
    const roles = res.locals.context?.roles || [];

    // Check if user is a student
    const isStudent = roles.some(
      (role: string) => role.includes("Student") || role.includes("Learner")
    );

    // Only students can submit assignments
    if (!isStudent) {
      return res.status(403).send({
        error: "Only students can submit assignments",
      });
    }

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
          transcript: resource.transcript || {
            "0:00": "No transcript available",
            "0:29": "Are you excited to be at GSV?",
            "0:38": "Absolutely.",
            "0:39":
              "It's fantastic to be here at the 2025 ASU GSV summit, sharing the wonders of Dreamscape Learn with everyone.",
          },
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

router.get("/submitted/audio", async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const token = res.locals.token;
    const roles = res.locals.context?.roles || [];

    // Check if user is an instructor/admin
    const isInstructor = roles.some(
      (role: string) =>
        role.includes("Instructor") ||
        role.includes("Administrator") ||
        role.includes("SysAdmin")
    );

    // Modify query based on role
    let countQuery = "SELECT COUNT(*) FROM submissions";
    let selectQuery = "SELECT * FROM submissions";
    const queryParams = [];

    // If not instructor, only show user's own submissions
    if (!isInstructor) {
      countQuery += " WHERE userid = $1";
      selectQuery += " WHERE userid = $1";
      queryParams.push(token.user);
    }

    selectQuery +=
      ' ORDER BY "createdat" DESC LIMIT $' +
      (queryParams.length + 1) +
      " OFFSET $" +
      (queryParams.length + 2);
    queryParams.push(limit, offset);

    const countResult = await db.query(
      countQuery,
      !isInstructor ? [token.user] : []
    );
    const totalItems = parseInt(countResult.rows[0].count);

    const result = await db.query(selectQuery, queryParams);

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
        feedback: submission.feedback,
        feedbackBy: submission.feedback_by,
        feedbackAt: submission.feedback_at,
        transcript: submission.items[0]?.custom?.transcript || {},
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
      isInstructor, // Adding this to help frontend know user's role
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).send({ error: "Failed to fetch submissions" });
  }
});

router.post("/feedback", async (req: any, res: any) => {
  try {
    const { submissionId, feedback } = req.body;
    const token = res.locals.token;
    const roles = res.locals.context?.roles || [];

    // Check if user is an instructor/admin
    const isInstructor = roles.some(
      (role: string) =>
        role.includes("Instructor") ||
        role.includes("Administrator") ||
        role.includes("SysAdmin")
    );

    // Only instructors can provide feedback
    if (!isInstructor) {
      return res.status(403).send({
        error: "Only instructors can provide feedback",
      });
    }

    // Validate required fields
    if (!submissionId || feedback === undefined) {
      return res.status(400).send({
        error: "Missing required fields: submissionId or feedback",
      });
    }

    // Update the submission with feedback
    await db.query(
      "UPDATE submissions SET feedback = $1, feedback_by = $2, feedback_at = $3 WHERE id = $4",
      [feedback, token.user, new Date(), submissionId]
    );

    return res.send({
      message: "Feedback saved successfully",
      submissionId,
      feedback,
    });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return res.status(500).send({ error: "Failed to save feedback" });
  }
});

// Helper function to format duration from seconds to mm:ss
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Names and Roles route
router.get("/members", async (req: any, res: any) => {
  try {
    const result = await lti.NamesAndRoles.getMembers(res.locals.token);
    if (result) {
      return res.send(result.members);
    }
    return res.status(500).send({ error: "Failed to fetch members" });
  } catch (err) {
    console.error("Names and Roles Error:", err);
    if (err instanceof Error) {
      return res.status(500).send({ error: err.message });
    }
    return res.status(500).send({ error: "An unknown error occurred" });
  }
});

// Update the catch-all route to handle the new paths
router.get("*", (req: any, res: any) => {
  const ltik = req.query.ltik;
  const path = req.path;
  // Preserve the original path when redirecting
  res.redirect(`http://localhost:4001${path}${ltik ? `?ltik=${ltik}` : ""}`);
});

export default router;
