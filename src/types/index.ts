export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  category: string;
  technologies: string[];
  year: number;
  featured: boolean;
  gallery: string[];
  mobileGallery:string[];
  client: string;
  role: string;
  demoUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  githubUrl?: string;
  challenges: string[];
  solutions: string[];
  incourse: boolean;
}

export interface AnimationProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}