import { prisma } from '../lib/prisma';

async function checkData() {
  try {
    console.log('=== 데이터베이스 상태 확인 ===\n');
    
    // 사용자 수 확인
    const userCount = await prisma.user.count();
    console.log(`전체 사용자 수: ${userCount}`);
    
    const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
    console.log(`교사 수: ${teacherCount}`);
    
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    console.log(`학생 수: ${studentCount}\n`);
    
    // 클래스 수 확인
    const classCount = await prisma.class.count();
    console.log(`전체 클래스 수: ${classCount}`);
    
    const classes = await prisma.class.findMany({
      include: {
        teacher: { select: { name: true } },
        _count: {
          select: {
            enrollments: true,
            projects: true,
          },
        },
      },
    });
    
    console.log('\n클래스별 상세 정보:');
    classes.forEach(cls => {
      console.log(`- ${cls.name} (교사: ${cls.teacher.name})`);
      console.log(`  등록 학생: ${cls._count.enrollments}명`);
      console.log(`  프로젝트: ${cls._count.projects}개`);
    });
    
    // 등록 현황 확인
    const enrollmentCount = await prisma.classEnrollment.count();
    console.log(`\n전체 클래스 등록 수: ${enrollmentCount}`);
    
    const enrollments = await prisma.classEnrollment.findMany({
      include: {
        student: { select: { name: true } },
        class: { select: { name: true } },
      },
    });
    
    console.log('\n등록 상세 정보:');
    enrollments.forEach(enrollment => {
      console.log(`- ${enrollment.student.name} → ${enrollment.class.name}`);
    });
    
    // 프로젝트 현황 확인
    const projectCount = await prisma.project.count();
    console.log(`\n전체 프로젝트 수: ${projectCount}`);
    
    const projects = await prisma.project.findMany({
      include: {
        student: { select: { name: true } },
        class: { select: { name: true } },
        template: { select: { title: true } },
      },
    });
    
    console.log('\n프로젝트 상세 정보:');
    projects.forEach(project => {
      console.log(`- ${project.title || '제목없음'} (학생: ${project.student.name})`);
      console.log(`  클래스: ${project.class?.name || '클래스없음'}`);
      console.log(`  템플릿: ${project.template.title}`);
      console.log(`  상태: ${project.status}`);
    });
    
    // 템플릿 수 확인
    const templateCount = await prisma.template.count();
    console.log(`\n전체 템플릿 수: ${templateCount}`);
    
    const templates = await prisma.template.findMany({
      include: {
        teacher: { select: { name: true } },
      },
    });
    
    console.log('\n템플릿 상세 정보:');
    templates.forEach(template => {
      console.log(`- ${template.title} (작성자: ${template.teacher?.name || '시스템'})`);
      console.log(`  기본 템플릿: ${template.isDefault ? '예' : '아니오'}`);
    });
    
  } catch (error) {
    console.error('데이터 확인 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
