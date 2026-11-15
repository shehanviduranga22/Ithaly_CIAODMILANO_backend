import { handleRequest } from "../server.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handleRequest;
