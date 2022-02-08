import util from "util"
import { getMenu } from "./loader";

getMenu().then(menu => console.log(util.inspect(menu, false, 10, true)))