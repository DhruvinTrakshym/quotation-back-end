export const buildOptions = [
  'Web Application',
  'Mobile App (iOS)',
  'Mobile App (Android)',
  'Mobile App (Cross-platform)',
  'Website',
  'Admin Panel',
  'APIs',
  'AI/ML Features',
  'Chatbot',
  'Cloud/DevOps',
  'UI/UX Design Only',
] as const;

export type BuildOption = (typeof buildOptions)[number];
