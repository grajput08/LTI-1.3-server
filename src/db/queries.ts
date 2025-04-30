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

interface UserData {
  user_id: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  email: string;
  roles?: string[];
}

interface AudioFileData {
  userId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

interface RecordingQueryResult {
  recordings: QueryResult;
  totalCount: number;
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

  /**
   * Check if user exists, create if they don't
   */
  async upsertUser(data: UserData): Promise<QueryResult> {
    // If email is missing, generate a placeholder email using user_id
    const email = data.email || `${data.user_id}@placeholder.com`;

    // First check if user exists
    const existingUser = await this.db.query(
      `SELECT user_id FROM users WHERE user_id = $1`,
      [data.user_id]
    );

    // If user doesn't exist, create new user
    if (existingUser.rows.length === 0) {
      return await this.db.query(
        `INSERT INTO users (user_id, given_name, family_name, name, email, roles)
             VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.user_id,
          data.given_name || null,
          data.family_name || null,
          data.name || null,
          email, // Use the email or placeholder
          data.roles || [],
        ]
      );
    }

    // If user exists, update their information
    return await this.db.query(
      `UPDATE users 
         SET given_name = COALESCE($2, given_name),
             family_name = COALESCE($3, family_name),
             name = COALESCE($4, name),
             email = COALESCE($5, email),
             roles = COALESCE($6, roles),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING *`,
      [
        data.user_id,
        data.given_name || null,
        data.family_name || null,
        data.name || null,
        email, // Use the email or placeholder
        data.roles || [],
      ]
    );
  }

  /**
   * Saves audio file information to database
   */
  async saveAudioFile(data: AudioFileData): Promise<QueryResult> {
    return await this.db.query(
      `INSERT INTO audio_files 
        (user_id, file_name, file_url, mime_type) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, file_url`,
      [data.userId, data.fileName, data.fileUrl, data.mimeType]
    );
  }

  /**
   * Gets recordings with pagination and role-based filtering
   */
  async getRecordings(
    userId: string,
    isInstructor: boolean,
    limit: number,
    offset: number
  ): Promise<RecordingQueryResult> {
    let countQuery =
      "SELECT COUNT(DISTINCT u.user_id) FROM users u JOIN audio_files af ON u.user_id = af.user_id";
    let selectQuery = `
      SELECT u.user_id, u.name, u.email, u.given_name, u.family_name,
             array_agg(json_build_object(
               'id', af.id,
               'fileName', af.file_name,
               'fileUrl', af.file_url,
               'mimeType', af.mime_type,
               'createdAt', af.created_at
             )) as recordings
      FROM users u
      JOIN audio_files af ON u.user_id = af.user_id`;
    const queryParams = [];

    // If not instructor, only show user's own recordings
    if (!isInstructor) {
      countQuery += " WHERE u.user_id = $1";
      selectQuery += " WHERE u.user_id = $1";
      queryParams.push(userId);
    }

    selectQuery += ` GROUP BY u.user_id, u.name, u.email, u.given_name, u.family_name
                     ORDER BY u.name
                     LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;
    queryParams.push(limit, offset);

    const countResult = await this.db.query(
      countQuery,
      !isInstructor ? [userId] : []
    );
    const totalCount = parseInt(countResult.rows[0].count);

    const recordings = await this.db.query(selectQuery, queryParams);

    return {
      recordings,
      totalCount,
    };
  }
}

// Export a singleton instance
export const dbQueries = new DatabaseQueries();
