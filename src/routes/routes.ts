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
    },
    {
      title: "Audio Record 2",
      duration: "4:20",
      artist: "Artist2",
    },
    {
      title: "Audio Record 3",
      duration: "2:55",
      artist: "Artist3",
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

interface DeepLinkRequest {
  name: string;
  value: string;
  description?: string;
  gradable?: boolean;
  startDate?: string;
  endDate?: string;
}

interface DeepLinkingResource {
  title: string;
  url?: string;
  path?: string;
}

interface LtiResourceLinkItem {
  type: "ltiResourceLink";
  title: string;
  custom: {
    name: string;
    value: string;
  };
}

router.post("/deeplink", async (req: any, res: any) => {
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
          resource_link_title: resource.title,
          artist: resource.artist || "",
          assignment_type: "audio_recording",
          duration: resource.duration || 1200, // default 20 minutes
        },
      },
    ];

    try {
      const deepLinkingMessage = await lti.DeepLinking.createDeepLinkingMessage(
        token,
        items,
        { message: "Successfully Registered" }
      );

      const responseJson = {
        deepLinkingMessage,
        lmsEndpoint:
          token.platformContext.deepLinkingSettings.deep_link_return_url,
      };

      console.log("Response JSON:", responseJson);

      // Create the deep linking form
      // const form = await lti.DeepLinking.createDeepLinkingForm(token, items, {
      //   message: "Successfully registered resource!",
      // });

      // console.log("Form:", form);

      // return res.send(form);
      if (deepLinkingMessage) {
        return res.send(responseJson);
      }
    } catch (dlError) {
      console.error("Deep Linking Error:", dlError);
      console.log("Deep Linking Settings:", dlError);
      if (
        dlError instanceof Error &&
        dlError.message === "MISSING_DEEP_LINK_SETTINGS"
      ) {
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
router.get("*", (req: any, res: any) => {
  const ltik = req.query.ltik;
  res.redirect(`http://localhost:4001${ltik ? `?ltik=${ltik}` : ""}`);
});

export default router;
