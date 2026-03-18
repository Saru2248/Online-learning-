// ─────────────────────────────────────────────────────────────────────
//  Prisma Seed Script — Demo data for EduFlow
//  Run: cd apps/api && npm run prisma:seed
// ─────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EduFlow database...\n');

  // ─── Clean up ──────────────────────────────────────────────────────
  await prisma.userSkill.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.section.deleteMany();
  await prisma.courseSkill.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();

  // ─── Skills ────────────────────────────────────────────────────────
  const skills = await Promise.all([
    prisma.skill.create({ data: { name: 'JavaScript', slug: 'javascript', category: 'Programming' } }),
    prisma.skill.create({ data: { name: 'TypeScript', slug: 'typescript', category: 'Programming' } }),
    prisma.skill.create({ data: { name: 'React', slug: 'react', category: 'Frontend' } }),
    prisma.skill.create({ data: { name: 'Node.js', slug: 'nodejs', category: 'Backend' } }),
    prisma.skill.create({ data: { name: 'Python', slug: 'python', category: 'Programming' } }),
    prisma.skill.create({ data: { name: 'Machine Learning', slug: 'machine-learning', category: 'AI/ML' } }),
    prisma.skill.create({ data: { name: 'Data Science', slug: 'data-science', category: 'AI/ML' } }),
    prisma.skill.create({ data: { name: 'PostgreSQL', slug: 'postgresql', category: 'Database' } }),
    prisma.skill.create({ data: { name: 'Docker', slug: 'docker', category: 'DevOps' } }),
    prisma.skill.create({ data: { name: 'AWS', slug: 'aws', category: 'Cloud' } }),
    prisma.skill.create({ data: { name: 'Next.js', slug: 'nextjs', category: 'Frontend' } }),
    prisma.skill.create({ data: { name: 'TailwindCSS', slug: 'tailwindcss', category: 'Frontend' } }),
  ]);

  const skillMap: Record<string, { id: string }> = {};
  skills.forEach(s => skillMap[s.slug] = s);
  console.log('✅ Skills created');

  // ─── Categories ────────────────────────────────────────────────────
  const cats = await Promise.all([
    prisma.category.create({ data: { name: 'Web Development', slug: 'web-development', icon: 'none' } }),
    prisma.category.create({ data: { name: 'Data Science', slug: 'data-science', icon: 'none' } }),
    prisma.category.create({ data: { name: 'Machine Learning', slug: 'machine-learning', icon: 'none' } }),
    prisma.category.create({ data: { name: 'Mobile Apps', slug: 'mobile-apps', icon: 'none' } }),
    prisma.category.create({ data: { name: 'Cloud & DevOps', slug: 'cloud-devops', icon: 'none' } }),
    prisma.category.create({ data: { name: 'UI/UX Design', slug: 'ui-ux-design', icon: 'none' } }),
  ]);

  const catMap: Record<string, { id: string }> = {};
  cats.forEach(c => catMap[c.slug] = c);
  console.log('✅ Categories created');

  // ─── Users ─────────────────────────────────────────────────────────
  const hashedPass = await bcrypt.hash('Demo12345', 12);

  const [adminUser, instructor1, instructor2, student1] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@eduflow.com',
        name: 'Admin EduFlow',
        passwordHash: hashedPass,
        role: 'ADMIN',
        isVerified: true,
        bio: 'Platform administrator',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@eduflow.com',
        name: 'Sarah Johnson',
        passwordHash: hashedPass,
        role: 'INSTRUCTOR',
        isVerified: true,
        bio: 'Full Stack Developer & Educator. 8+ years teaching web development. 50K+ students.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@eduflow.com',
        name: 'Mike Chen',
        passwordHash: hashedPass,
        role: 'INSTRUCTOR',
        isVerified: true,
        bio: 'ML Engineer @ Google, PhD Stanford. Passionate about democratizing AI education.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      },
    }),
    prisma.user.create({
      data: {
        email: 'demo@eduflow.com',
        name: 'Demo User',
        passwordHash: hashedPass,
        role: 'STUDENT',
        isVerified: true,
        bio: 'Lifelong learner',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      },
    }),
  ]);

  console.log('✅ Users created');

  // ─── Course 1: Complete Web Dev Bootcamp ───────────────────────────
  const course1 = await prisma.course.create({
    data: {
      title: 'The Complete Web Development Bootcamp 2024',
      slug: 'complete-web-development-bootcamp-2024',
      shortDesc: 'Master HTML, CSS, JavaScript, React, Node.js & more. Build real-world projects.',
      description: `Learn web development from scratch to advanced concepts. This comprehensive bootcamp covers:
- HTML5 & CSS3 fundamentals and advanced layouts
- JavaScript ES6+ and modern features
- React 18 with hooks and state management
- Node.js & Express REST API development
- PostgreSQL database design and queries
- Full-stack deployment with Docker & AWS

Build 15+ real-world projects and join 250,000+ students worldwide.`,
      price: 13.99,
      originalPrice: 84.99,
      level: 'BEGINNER',
      status: 'PUBLISHED',
      language: 'English',
      duration: 4200,
      thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=640&h=360&fit=crop',
      tags: ['html', 'css', 'javascript', 'react', 'nodejs'],
      objectives: [
        'Build responsive websites with HTML5 and CSS3',
        'Write clean JavaScript and understand ES6+ features',
        'Create React apps with hooks and context API',
        'Build REST APIs with Node.js and Express',
        'Work with PostgreSQL and design databases',
        'Deploy full-stack apps with Docker',
      ],
      avgRating: 4.8,
      totalStudents: 248532,
      totalViews: 890234,
      instructorId: instructor1.id,
      categoryId: catMap['web-development'].id,
      courseSkills: {
        create: [
          { skillId: skillMap['javascript'].id },
          { skillId: skillMap['react'].id },
          { skillId: skillMap['nodejs'].id },
          { skillId: skillMap['typescript'].id },
        ],
      },
    },
  });

  // Sections & Lessons for Course 1
  const section1_1 = await prisma.section.create({
    data: {
      courseId: course1.id,
      title: 'Getting Started with HTML & CSS',
      order: 1,
      description: 'Learn the foundations of web development',
      lessons: {
        create: [
          { title: 'Course Introduction & Setup', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 12, order: 1, type: 'VIDEO', isFree: true },
          { title: 'How the Web Works', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 18, order: 2, type: 'VIDEO', isFree: true },
          { title: 'Your First HTML Page', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 22, order: 3, type: 'VIDEO', isFree: false },
          { title: 'HTML Semantic Elements Deep Dive', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 28, order: 4, type: 'VIDEO', isFree: false },
          { title: 'CSS Fundamentals: Selectors & Properties', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 35, order: 5, type: 'VIDEO', isFree: false },
          { title: 'Flexbox & CSS Grid Mastery', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 42, order: 6, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  const section1_2 = await prisma.section.create({
    data: {
      courseId: course1.id,
      title: 'JavaScript — From Zero to Hero',
      order: 2,
      lessons: {
        create: [
          { title: 'JavaScript Basics: Variables, Types, Operators', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 30, order: 1, type: 'VIDEO', isFree: false },
          { title: 'Functions, Scope & Closures', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 38, order: 2, type: 'VIDEO', isFree: false },
          { title: 'Arrays, Objects & Destructuring', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 35, order: 3, type: 'VIDEO', isFree: false },
          { title: 'Promises, Async/Await & Fetch API', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 48, order: 4, type: 'VIDEO', isFree: false },
          { title: 'DOM Manipulation in Depth', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 40, order: 5, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  const section1_3 = await prisma.section.create({
    data: {
      courseId: course1.id,
      title: 'React — Modern Frontend Development',
      order: 3,
      lessons: {
        create: [
          { title: 'Introduction to React & JSX', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 25, order: 1, type: 'VIDEO', isFree: false },
          { title: 'React Hooks: useState & useEffect', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 45, order: 2, type: 'VIDEO', isFree: false },
          { title: 'State Management with Context API', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 38, order: 3, type: 'VIDEO', isFree: false },
          { title: 'React Router & Navigation', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 30, order: 4, type: 'VIDEO', isFree: false },
          { title: 'Building a Full React App', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 65, order: 5, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  // ─── Course 2: Machine Learning with Python ─────────────────────
  const course2 = await prisma.course.create({
    data: {
      title: 'Machine Learning A-Z: AI, Python & R in Data Science',
      slug: 'machine-learning-a-z-python-ai-data-science',
      shortDesc: 'Learn to create Machine Learning Algorithms in Python and R from two Data Science experts.',
      description: `This course covers Machine Learning from beginner to expert level. You will:
- Understand the intuition behind Machine Learning algorithms
- Build Machine Learning models in Python and R
- Handle supervised, unsupervised and reinforcement learning
- Create deep learning neural networks
- Tackle NLP problems
- Work on real-world datasets

Perfect for software engineers wanting to add ML skills.`,
      price: 15.99,
      originalPrice: 94.99,
      level: 'INTERMEDIATE',
      status: 'PUBLISHED',
      language: 'English',
      duration: 5400,
      thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=640&h=360&fit=crop',
      tags: ['machine-learning', 'python', 'AI', 'data-science', 'deep-learning'],
      objectives: [
        'Master Machine Learning algorithms from scratch',
        'Build deep learning models with TensorFlow',
        'Apply ML to real-world business problems',
        'Understand natural language processing',
        'Work with image recognition and CNNs',
      ],
      avgRating: 4.9,
      totalStudents: 983450,
      totalViews: 3200000,
      instructorId: instructor2.id,
      categoryId: catMap['machine-learning'].id,
      courseSkills: {
        create: [
          { skillId: skillMap['python'].id },
          { skillId: skillMap['machine-learning'].id },
          { skillId: skillMap['data-science'].id },
        ],
      },
    },
  });

  const section2_1 = await prisma.section.create({
    data: {
      courseId: course2.id,
      title: 'Data Preprocessing',
      order: 1,
      lessons: {
        create: [
          { title: 'Welcome & Course Roadmap', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 8, order: 1, type: 'VIDEO', isFree: true },
          { title: 'Importing Libraries', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 15, order: 2, type: 'VIDEO', isFree: true },
          { title: 'Handling Missing Data', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 22, order: 3, type: 'VIDEO', isFree: false },
          { title: 'Feature Scaling', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 18, order: 4, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  const section2_2 = await prisma.section.create({
    data: {
      courseId: course2.id,
      title: 'Regression',
      order: 2,
      lessons: {
        create: [
          { title: 'Simple Linear Regression Intuition', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 25, order: 1, type: 'VIDEO', isFree: false },
          { title: 'Simple Linear Regression in Python', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 30, order: 2, type: 'VIDEO', isFree: false },
          { title: 'Multiple Linear Regression', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 35, order: 3, type: 'VIDEO', isFree: false },
          { title: 'Polynomial Regression', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 28, order: 4, type: 'VIDEO', isFree: false },
          { title: 'Random Forest Regression', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 40, order: 5, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  // ─── Course 3: Next.js + TypeScript ───────────────────────────────
  const course3 = await prisma.course.create({
    data: {
      title: 'Next.js 14 & TypeScript: Build Production Apps',
      slug: 'nextjs-14-typescript-production-apps',
      shortDesc: 'Master Next.js 14, TypeScript, Prisma & TailwindCSS. Build real production apps.',
      description: 'Comprehensive guide to building production-grade applications with Next.js 14, TypeScript, Prisma ORM, and TailwindCSS. Covers App Router, Server Components, API Routes, Authentication and Deployment.',
      price: 0,
      level: 'INTERMEDIATE',
      status: 'PUBLISHED',
      language: 'English',
      duration: 2400,
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=640&h=360&fit=crop',
      tags: ['nextjs', 'typescript', 'react', 'tailwindcss'],
      objectives: [
        'Build apps with Next.js 14 App Router',
        'Use TypeScript for type-safe development',
        'Implement authentication with NextAuth.js',
        'Style with TailwindCSS',
        'Deploy to Vercel',
      ],
      avgRating: 4.7,
      totalStudents: 45230,
      totalViews: 156000,
      instructorId: instructor1.id,
      categoryId: catMap['web-development'].id,
      courseSkills: {
        create: [
          { skillId: skillMap['nextjs'].id },
          { skillId: skillMap['typescript'].id },
          { skillId: skillMap['tailwindcss'].id },
          { skillId: skillMap['react'].id },
        ],
      },
    },
  });

  await prisma.section.create({
    data: {
      courseId: course3.id,
      title: 'Next.js 14 Foundations',
      order: 1,
      lessons: {
        create: [
          { title: 'What is Next.js? App vs Pages Router', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 20, order: 1, type: 'VIDEO', isFree: true },
          { title: 'Project Setup & File Structure', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 15, order: 2, type: 'VIDEO', isFree: true },
          { title: 'Server vs Client Components', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 30, order: 3, type: 'VIDEO', isFree: false },
          { title: 'Data Fetching Strategies', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 35, order: 4, type: 'VIDEO', isFree: false },
          { title: 'API Routes & Route Handlers', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 28, order: 5, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  // ─── Course 4: Cloud & DevOps ────────────────────────────────────
  const course4 = await prisma.course.create({
    data: {
      title: 'AWS & Docker: Cloud DevOps from Zero to Production',
      slug: 'aws-docker-cloud-devops-zero-production',
      shortDesc: 'Learn Docker, Kubernetes, AWS, CI/CD pipelines. Deploy apps like a pro DevOps engineer.',
      description: 'Master Cloud and DevOps with hands-on AWS and Docker training. Learn containerization, orchestration, CI/CD, infrastructure as code, and monitoring.',
      price: 18.99,
      originalPrice: 109.99,
      level: 'ADVANCED',
      status: 'PUBLISHED',
      language: 'English',
      duration: 3600,
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=640&h=360&fit=crop',
      tags: ['aws', 'docker', 'devops', 'kubernetes', 'ci-cd'],
      objectives: [
        'Master Docker containerization',
        'Deploy to AWS ECS and EKS',
        'Build CI/CD pipelines with GitHub Actions',
        'Implement Infrastructure as Code with Terraform',
      ],
      avgRating: 4.6,
      totalStudents: 123450,
      totalViews: 450000,
      instructorId: instructor2.id,
      categoryId: catMap['cloud-devops'].id,
      courseSkills: {
        create: [
          { skillId: skillMap['docker'].id },
          { skillId: skillMap['aws'].id },
          { skillId: skillMap['postgresql'].id },
        ],
      },
    },
  });

  await prisma.section.create({
    data: {
      courseId: course4.id,
      title: 'Docker Fundamentals',
      order: 1,
      lessons: {
        create: [
          { title: 'What is Docker and Why Use It?', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 20, order: 1, type: 'VIDEO', isFree: true },
          { title: 'Installing Docker Desktop', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 10, order: 2, type: 'VIDEO', isFree: true },
          { title: 'Docker Images & Containers', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 35, order: 3, type: 'VIDEO', isFree: false },
          { title: 'Writing Dockerfiles', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 40, order: 4, type: 'VIDEO', isFree: false },
          { title: 'Docker Compose for Multi-Service Apps', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 50, order: 5, type: 'VIDEO', isFree: false },
        ],
      },
    },
  });

  console.log('✅ Courses, Sections & Lessons created');

  // ─── Enrollments & Progress (demo student) ─────────────────────
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: course1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: course2.id,
      status: 'ACTIVE',
    },
  });

  // Add some lesson progress
  const section1lessons = await prisma.lesson.findMany({
    where: { section: { courseId: course1.id } },
    take: 3,
  });

  for (const lesson of section1lessons) {
    await prisma.progress.create({
      data: {
        userId: student1.id,
        lessonId: lesson.id,
        courseId: course1.id,
        isCompleted: true,
        watchedSeconds: lesson.duration * 60,
        completedAt: new Date(),
      },
    });
  }

  console.log('✅ Enrollments & Progress created');

  // ─── Ratings ───────────────────────────────────────────────────
  await prisma.rating.createMany({
    data: [
      {
        userId: student1.id,
        courseId: course1.id,
        rating: 5,
        review: 'Absolutely incredible course! Sarah explains every concept so clearly. The projects are real-world and the community is super helpful. Best investment I ever made!',
      },
      {
        userId: adminUser.id,
        courseId: course2.id,
        rating: 5,
        review: 'Mike is an amazing instructor. The way he explains complex ML concepts is brilliant. I was able to land a Data Scientist role after completing this course!',
      },
    ],
  });

  console.log('✅ Ratings created');

  // ─── Interactions (for trending algorithm) ──────────────────────
  const interactions = [];
  const courses = [course1, course2, course3, course4];
  const users = [student1, adminUser];
  const types = ['VIEW', 'SEARCH', 'ENROLL'];

  for (let i = 0; i < 50; i++) {
    const course = courses[i % courses.length];
    const user = users[i % users.length];
    const type = types[i % types.length];
    interactions.push({
      userId: user.id,
      courseId: course.id,
      type,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.interaction.createMany({ data: interactions });
  console.log('✅ Interactions created (for trending algorithm)');

  // ─── Wishlist ──────────────────────────────────────────────────
  await prisma.wishlist.createMany({
    data: [
      { userId: student1.id, courseId: course3.id },
      { userId: student1.id, courseId: course4.id },
    ],
  });

  console.log('✅ Wishlists created');

  // ─── Summary ───────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`  • ${skills.length} skills`);
  console.log(`  • ${cats.length} categories`);
  console.log(`  • 4 users (1 admin, 2 instructors, 1 student)`);
  console.log(`  • 4 courses with full curriculum`);
  console.log(`  • 50 interaction records`);
  console.log('\n🔐 Demo Login Credentials:');
  console.log('  Student:    demo@eduflow.com   / Demo12345');
  console.log('  Instructor: sarah@eduflow.com  / Demo12345');
  console.log('  ML Tutor:   mike@eduflow.com   / Demo12345');
  console.log('  Admin:      admin@eduflow.com  / Demo12345');
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
