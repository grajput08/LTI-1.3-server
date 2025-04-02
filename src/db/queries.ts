import { Pool, QueryResult } from "pg";
import db from "./config";

interface SubmissionData {
  userId: string;
  title: string;
  artist: string;
  link: string;
  duration: number | string;
  createdAt: Date;
  platformContext: any;
  items: any[];
}

interface FeedbackData {
  submissionId: number;
  feedback: string;
  feedbackBy: string;
  feedbackAt: Date;
}

export class DatabaseQueries {
  private db: Pool;

  constructor() {
    this.db = db;
  }

  /**
   * Creates a new submission in the database
   */
  async createSubmission(data: SubmissionData): Promise<QueryResult> {
    // Convert duration from "mm:ss" to seconds if needed
    const durationInSeconds =
      typeof data.duration === "string" && data.duration.includes(":")
        ? data.duration
            .split(":")
            .reduce((acc: number, time: string) => 60 * acc + parseInt(time), 0)
        : Number(data.duration) || 1200;

    return await this.db.query(
      `INSERT INTO submissions 
            (userId, title, artist, link, duration, createdAt, platformContext, items) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.userId,
        data.title,
        data.artist,
        data.link,
        durationInSeconds,
        data.createdAt,
        JSON.stringify(data.platformContext),
        JSON.stringify(data.items),
      ]
    );
  }

  /**
   * Retrieves submissions with pagination and role-based filtering
   */
  async getSubmissions(
    userId: string,
    isInstructor: boolean,
    limit: number,
    offset: number
  ): Promise<{
    submissions: QueryResult;
    totalCount: QueryResult;
  }> {
    const countQuery = isInstructor
      ? "SELECT COUNT(*) FROM submissions"
      : "SELECT COUNT(*) FROM submissions WHERE userid = $1";

    const selectQuery = `
            SELECT * FROM submissions 
            ${!isInstructor ? "WHERE userid = $1" : ""} 
            ORDER BY "createdat" DESC 
            LIMIT $${isInstructor ? "1" : "2"} 
            OFFSET $${isInstructor ? "2" : "3"}
        `;

    const countResult = await this.db.query(
      countQuery,
      !isInstructor ? [userId] : []
    );

    const submissionsResult = await this.db.query(
      selectQuery,
      !isInstructor ? [userId, limit, offset] : [limit, offset]
    );

    return {
      submissions: submissionsResult,
      totalCount: countResult,
    };
  }

  /**
   * Updates submission feedback
   */
  async updateFeedback(data: FeedbackData): Promise<QueryResult> {
    return await this.db.query(
      `UPDATE submissions 
            SET feedback = $1, feedback_by = $2, feedback_at = $3 
            WHERE id = $4`,
      [data.feedback, data.feedbackBy, data.feedbackAt, data.submissionId]
    );
  }
}

// Export a singleton instance
export const dbQueries = new DatabaseQueries();
