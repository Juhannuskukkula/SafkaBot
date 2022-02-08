import util from "util";
import dotenv from "dotenv";
import https from "https";
import { getMenu } from "./menuLoader";
import { poller } from "./pollMenu";

dotenv.config();

const POLL_RATE = process.env.POLL_RATE as unknown as number;

setInterval(() => {
  poller().then(shouldLoad => {
    if (shouldLoad) {
      getMenu().then(menu => {
        console.log(menu);
      });
    }
  });
}, POLL_RATE / 1000);