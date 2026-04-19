// app/types/resume.ts

export interface ResumeHeader {
  name: string;
  title: string;
  subtitle?: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
}

export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;       // "YYYY-MM"
  end: string;         // "YYYY-MM" or "present"
  bullets: string[];
  tech: string[];
  freelance?: boolean;
}

export interface Education {
  school: string;
  location: string;
  degree: string;
  field?: string;
  year: number;
}

export interface Certification {
  name: string;
  code?: string;
  issued: string;      // "YYYY-MM"
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Contact {
  email: string;
  github: string;
  linkedin: string;
}

export interface Resume {
  header: ResumeHeader;
  summary: string;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: SkillGroup[];
  contact: Contact;
}
