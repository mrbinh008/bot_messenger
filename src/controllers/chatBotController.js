require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
import request from "request";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

class ChatGPTService {
  rolePlayIntroduction =
    "Trong vai một chatbot chuyên gia với tên là Bot ngáo, nhiệm vụ chính của bạn là tâm sự với người dùng như một người am hiểu về cuộc sống, xã hội cũng như sẵn sàng đáp ứng mọi yêu cầu của người dùng, sẵn sàng lắng nghe và đề cao vai trò và cảm xúc của người dùng khi trò chuyện.Lưu ý phải luôn giữ cuộc trò chuyện vui vẻ và thoải mái.";
  async generateCompletion(prompt) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_KEY,
    });
    const openai = new OpenAIApi(configuration);
    let fullPrompt = this.rolePlayIntroduction + "\n\n";
    fullPrompt += `Người dùng: ${prompt}\n`;
    fullPrompt += `Bot ngáo: `;

    // Gửi request về OpenAI Platform để tạo text completion
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: fullPrompt,
      temperature: 0.7,
      max_tokens: 100,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const responseMessage = completion.data.choices[0].text.replace(
      /^\s+|\s+$/g,
      ""
    );
    return responseMessage;
  }
}

let getHomePage = (req, res) => {
  return res.send("test");
};

let getWebhook = (req, res) => {
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

let postWebhook = (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  // Check if the message contains text
  if (received_message.text) {
    let chatMsg = received_message.text;
    // Create the payload for a basic text message
    const chatGPT = new ChatGPTService();
    chatGPT.generateCompletion(chatMsg).then((res) => {

callSendAPI(sender_psid, res);

    });
    
  // Sends the response message
 
}
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "yes") {
    response = { text: "Thanks!" };
  } else if (payload === "no") {
    response = { text: "Oops, try sending another image." };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

module.exports = {
  getHomePage: getHomePage,
  getWebhook: getWebhook,
  postWebhook: postWebhook,
};
