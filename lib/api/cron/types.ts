export type CronJobResult = {
  job: string;
  processed: number;
  created: number;
  skipped: number;
  emailsSent: number;
  errors: string[];
};
