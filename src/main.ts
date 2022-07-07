import fetch from "node-fetch";
import chalk from "chalk";
import { CONSTANTS } from "./constants";

//Para evitar el ssl
require("https").globalAgent.options.ca = require("ssl-root-cas").create();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

export class Main {
  private state = { actualState: "", lastState: "" };
  private url: string;
  private processing: boolean = false;
  private appointments = 0;
  private ms: number;

  constructor(url: string = CONSTANTS.URL, ms: number = CONSTANTS.MS) {
    this.url = url;
    this.ms = ms;
  }

  private separator() {
    console.log(chalk.white(CONSTANTS.SEPARATOR));
  }

  private showResults() {
    this.separator();
    this.separator();
    this.separator();

    // Update Results log
    console.log(chalk.bgGreen(CONSTANTS.RESULTS_UPDATES));
    console.log(this.state.actualState);

    this.separator();

    // Last state log
    if (this.state.lastState) {
      console.log(CONSTANTS.LAST_RESULT);
      console.log(this.state.lastState);
      this.separator();
    }

    // Next Update log
    console.log(
      chalk.bgBlueBright(
        `(${new Date().getHours()}:${new Date().getMinutes()})`
      ),
      CONSTANTS.NEXT_UPDATE,
      chalk.bgBlueBright(
        `(${new Date().getHours()}:${
          new Date().getMinutes() + this.msToMinutes(CONSTANTS.MS)
        })`
      )
    );

    this.separator();
    this.separator();
    this.separator();
  }

  private success() {
    this.state.lastState = this.state.actualState;
    this.state.actualState = `${this.appointments} ${CONSTANTS.SUCCESS}`;
    this.processing = false;
    this.showResults();
  }

  private appointmentsNotAvailable() {
    this.state.lastState = this.state.actualState;
    this.state.actualState = CONSTANTS.APPOINTMENTS_NOT_AVAILABLE;
    this.processing = false;
    this.appointments = 0;
    this.showResults();
  }

  private msToMinutes(ms: number) {
    const minutes = Math.floor(ms / 60000);
    return minutes;
  }

  private isProcessing() {
    if (this.state.lastState) {
      this.separator();
      console.log(CONSTANTS.PROCESSING);
      console.log(this.state.lastState);
      this.separator();
    } else {
      this.separator();
      console.log(CONSTANTS.FIRST_TIME);
      this.separator();
    }
  }

  private showError(e: any) {
    console.log(CONSTANTS.ERROR, chalk.bgRed(e));
  }

  private async verifyData() {
    // Processing logs
    const intervalId = setInterval(() => {
      console.log(CONSTANTS.FIRST_TIME);
    }, 5000);

    // Fetch Data
    const response = await fetch(this.url);
    const data = await response.json();
    let available: boolean = false;

    // Verify appointments
    await data.map((el: any) => {
      if (el.horarios) {
        this.appointments = this.appointments + 1;
        available = true;
      }
    });

    clearInterval(intervalId);

    //If appointments are available
    if (available) {
      this.success();
    } else {
      this.appointmentsNotAvailable();
    }
  }

  //Wrapper for verifyData
  private async runProcess() {
    try {
      await this.verifyData();
    } catch (e) {
      this.showError(e);
    }
  }

  async start() {
    // Welcome Log
    console.log(chalk.bgBlue(CONSTANTS.START));

    // Run process first time
    await this.runProcess();

    // Run process every this.ms
    setInterval(async () => {
      const processing = this.processing;
      if (!processing) {
        this.processing = true;
        await this.runProcess();
      }
      if (processing) {
        this.isProcessing();
      }
    }, this.ms);
  }
}
