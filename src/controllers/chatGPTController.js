const openai = require('openai');

class ChatGPTController {
  constructor(api_key) {
    this.api_key = api_key;
    this.openai_api = new openai(api_key);
    this.engine = 'text-davinci-003';
    this.max_tokens = 100;
  }

  async generateText(prompt) {
    try {
      const response = await this.openai_api.completions.create({
        engine: this.engine,
        prompt: prompt,
        max_tokens: this.max_tokens,
      });
      return response.data.choices[0].text.replace(
        /^\s+|\s+$/g,
        "");
    } catch (err) {
      console.log(err);
      return '';
    }
  }
}

module.exports = ChatGPTController;
