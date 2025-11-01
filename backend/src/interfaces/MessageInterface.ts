export interface ChatGPTMessage {
  role: string;
  content: string;
  image_url?: string;
}

export interface ChatGPTResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}


export interface ChatGPTContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}


export interface ChatGPTMessageWithImage {
  role: string;
  content: string | ChatGPTContent[];
}