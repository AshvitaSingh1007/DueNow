import { GoogleGenAI } from '@google/genai';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  htmlLink?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface GoogleEmail {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export class GoogleContextService {
  /**
   * Safe fetch for Google APIs with Authorization header
   */
  private static async safeFetch(url: string, token: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        console.warn(`Google API Warning on ${url} - Status: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`Google API Error on ${url}:`, error);
      return null;
    }
  }

  /**
   * Fetch upcoming calendar events
   */
  static async fetchCalendarEvents(token: string): Promise<GoogleCalendarEvent[]> {
    const nowISO = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&timeMin=${nowISO}&singleEvents=true&orderBy=startTime`;
    const data = await this.safeFetch(url, token);
    
    if (!data || !data.items) return [];
    
    return data.items.map((item: any) => ({
      id: item.id,
      summary: item.summary || 'Untitled Event',
      description: item.description,
      startTime: item.start?.dateTime || item.start?.date || '',
      endTime: item.end?.dateTime || item.end?.date || '',
      htmlLink: item.htmlLink,
    }));
  }

  /**
   * Fetch recent Google Drive files
   */
  static async fetchDriveFiles(token: string, folderId?: string): Promise<GoogleDriveFile[]> {
    let query = 'trashed = false';
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=15&q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc`;
    const data = await this.safeFetch(url, token);
    
    if (!data || !data.files) return [];
    
    return data.files;
  }

  /**
   * Fetch Google Tasks (two-way sync target)
   */
  static async fetchGoogleTasks(token: string): Promise<any[]> {
    const url = 'https://tasks.googleapis.com/v1/lists/@default/tasks?maxResults=30';
    const data = await this.safeFetch(url, token);
    if (!data || !data.items) return [];
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.title || 'Untitled Task',
      notes: item.notes || '',
      status: item.status, // 'needsAction' or 'completed'
      due: item.due || null,
      updated: item.updated
    }));
  }

  /**
   * Fetch Google Contacts for professional context recognition
   */
  static async fetchGoogleContacts(token: string): Promise<any[]> {
    const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations&pageSize=50';
    const data = await this.safeFetch(url, token);
    if (!data || !data.connections) return [];
    return data.connections.map((item: any) => {
      const name = item.names?.[0]?.displayName || 'Unknown Contact';
      const email = item.emailAddresses?.[0]?.value || '';
      const organization = item.organizations?.[0]?.name || '';
      const title = item.organizations?.[0]?.title || '';
      
      // Categorize contacts based on tags or titles
      let role: 'recruiter' | 'interviewer' | 'manager' | 'client' | 'professor' | 'contact' = 'contact';
      const checkText = `${title} ${organization} ${name}`.toLowerCase();
      if (checkText.includes('recruit') || checkText.includes('talent')) role = 'recruiter';
      else if (checkText.includes('interview') || checkText.includes('hiring')) role = 'interviewer';
      else if (checkText.includes('manager') || checkText.includes('lead') || checkText.includes('director')) role = 'manager';
      else if (checkText.includes('client') || checkText.includes('partner') || checkText.includes('customer')) role = 'client';
      else if (checkText.includes('prof') || checkText.includes('teach') || checkText.includes('advisor') || checkText.includes('instructor')) role = 'professor';

      return {
        id: item.resourceName,
        name,
        email,
        company: organization,
        title,
        role
      };
    });
  }

  /**
   * Fetch recent Google Docs specifically
   */
  static async fetchGoogleDocs(token: string): Promise<GoogleDriveFile[]> {
    const query = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=10&q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc`;
    const data = await this.safeFetch(url, token);
    return data?.files || [];
  }

  /**
   * Fetch recent Google Slides specifically
   */
  static async fetchGoogleSlides(token: string): Promise<GoogleDriveFile[]> {
    const query = "mimeType = 'application/vnd.google-apps.presentation' and trashed = false";
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=10&q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc`;
    const data = await this.safeFetch(url, token);
    return data?.files || [];
  }

  /**
   * Fetch and parse Google Meet video meetings from calendar
   */
  static async fetchGoogleMeets(token: string): Promise<any[]> {
    const nowISO = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20&timeMin=${nowISO}&singleEvents=true&orderBy=startTime`;
    const data = await this.safeFetch(url, token);
    if (!data || !data.items) return [];
    
    return data.items
      .filter((item: any) => item.hangoutLink || item.conferenceData)
      .map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Google Meet Conference',
        startTime: item.start?.dateTime || item.start?.date || '',
        endTime: item.end?.dateTime || item.end?.date || '',
        meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri || '',
        attendees: item.attendees?.map((a: any) => a.email) || []
      }));
  }

  /**
   * Fetch and parse recent Gmail messages (read-only)
   */
  static async fetchRecentEmails(token: string): Promise<GoogleEmail[]> {
    const listUrl = 'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=8';
    const listData = await this.safeFetch(listUrl, token);
    
    if (!listData || !listData.messages) return [];
    
    const emails: GoogleEmail[] = [];
    
    // Fetch details for each message
    for (const msg of listData.messages) {
      const detailUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const detail = await this.safeFetch(detailUrl, token);
      if (detail) {
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        
        emails.push({
          id: detail.id,
          snippet: detail.snippet || '',
          subject,
          from,
          date,
        });
      }
    }
    
    return emails;
  }

  /**
   * Generate a comprehensive context string for the AI prompt
   */
  static async getGoogleWorkspaceSummary(token: string): Promise<string> {
    if (!token) return 'Google Workspace integration is not connected.';

    try {
      const [events, files, emails, tasks, contacts, meets] = await Promise.all([
        this.fetchCalendarEvents(token).catch(() => []),
        this.fetchDriveFiles(token).catch(() => []),
        this.fetchRecentEmails(token).catch(() => []),
        this.fetchGoogleTasks(token).catch(() => []),
        this.fetchGoogleContacts(token).catch(() => []),
        this.fetchGoogleMeets(token).catch(() => []),
      ]);

      let summary = '\n--- CONNECTED GOOGLE WORKSPACE SERVICES CONTEXT ---\n';

      summary += '\nUPCOMING CALENDAR EVENTS:\n';
      if (events.length === 0) {
        summary += 'No upcoming events found.\n';
      } else {
        events.forEach((ev) => {
          summary += `- "${ev.summary}" from ${new Date(ev.startTime).toLocaleString()} to ${new Date(ev.endTime).toLocaleString()}${ev.description ? ` (${ev.description})` : ''}\n`;
        });
      }

      summary += '\nACTIVE GOOGLE MEET SESSIONS:\n';
      if (meets.length === 0) {
        summary += 'No virtual meeting conferences scheduled.\n';
      } else {
        meets.forEach((m) => {
          summary += `- "${m.summary}" | Time: ${new Date(m.startTime).toLocaleString()} | Link: ${m.meetLink} | Attendees: ${m.attendees.join(', ') || 'none'}\n`;
        });
      }

      summary += '\nGOOGLE TASKS SYNCHRONIZATION POOL:\n';
      if (tasks.length === 0) {
        summary += 'No active Google Tasks found.\n';
      } else {
        tasks.forEach((t) => {
          summary += `- "${t.title}" | Status: ${t.status} | Due: ${t.due ? new Date(t.due).toLocaleDateString() : 'no deadline'}${t.notes ? ` (Notes: ${t.notes})` : ''}\n`;
        });
      }

      summary += '\nGOOGLE CONTACTS & KEY PROFESSIONAL NETWORK:\n';
      if (contacts.length === 0) {
        summary += 'No connected contact relationships indexed.\n';
      } else {
        contacts.forEach((c) => {
          summary += `- Name: ${c.name} | Role: ${c.role.toUpperCase()} | Email: ${c.email} | Title: ${c.title} (${c.company})\n`;
        });
      }

      summary += '\nRECENT DRIVE FILES:\n';
      if (files.length === 0) {
        summary += 'No recent files found in connected folders.\n';
      } else {
        files.forEach((f) => {
          summary += `- "${f.name}" (${f.mimeType}) - Modified: ${new Date(f.modifiedTime).toLocaleDateString()}\n`;
        });
      }

      summary += '\nRECENT EMAIL SUMMARIES (READ-ONLY):\n';
      if (emails.length === 0) {
        summary += 'No recent emails found.\n';
      } else {
        emails.forEach((em) => {
          summary += `- FROM: ${em.from} | SUBJECT: ${em.subject} | DATE: ${em.date}\n  SNIPPET: ${em.snippet}\n`;
        });
      }

      summary += '\n-------------------------------------------------\n';
      return summary;
    } catch (err) {
      console.error('Error constructing Google Workspace Context Summary:', err);
      return 'Failed to retrieve connected Google Workspace context.';
    }
  }
}
