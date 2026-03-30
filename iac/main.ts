import { App } from "cdktf";
import { MyDemo } from "./src/demo-aws";

const app = new App();
new MyDemo(app, "cdktf-demo");
app.synth();
