import { seedDefaultTemplates } from "../lib/seed-templates";

async function main() {
  console.log("시드 데이터 생성을 시작합니다...");
  
  try {
    await seedDefaultTemplates();
    console.log("시드 데이터 생성이 완료되었습니다!");
  } catch (error) {
    console.error("시드 데이터 생성 중 오류가 발생했습니다:", error);
    process.exit(1);
  }
}

main();
