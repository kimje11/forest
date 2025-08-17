import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestData() {
  try {
    console.log('=== 테스트 데이터 생성 시작 ===\n')

    // 1. 교사 계정 생성 (Supabase Auth)
    const teacherEmail = 'teacher@test.com'
    const teacherPassword = 'teacher123'
    
    console.log('1. 교사 계정 생성 중...')
    const { data: teacherAuthData, error: teacherAuthError } = await supabase.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
      user_metadata: {
        name: '테스트 교사',
        role: 'TEACHER'
      }
    })

    if (teacherAuthError && !teacherAuthError.message.includes('already registered')) {
      console.error('교사 계정 생성 실패:', teacherAuthError)
      return
    }

    const teacherId = teacherAuthData?.user?.id || 'teacher-id-placeholder'
    console.log(`교사 ID: ${teacherId}`)

    // 2. 학생 계정 생성
    const studentEmail = 'student@test.com'
    const studentPassword = 'student123'
    
    console.log('2. 학생 계정 생성 중...')
    const { data: studentAuthData, error: studentAuthError } = await supabase.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        name: '테스트 학생',
        role: 'STUDENT'
      }
    })

    if (studentAuthError && !studentAuthError.message.includes('already registered')) {
      console.error('학생 계정 생성 실패:', studentAuthError)
      return
    }

    const studentId = studentAuthData?.user?.id || 'student-id-placeholder'
    console.log(`학생 ID: ${studentId}`)

    // 3. Prisma를 통한 데이터베이스 작업을 위해 별도 스크립트 필요
    console.log('\n=== Supabase Auth 계정 생성 완료 ===')
    console.log('다음 단계:')
    console.log('1. http://localhost:3000/auth/login에서 teacher@test.com / teacher123으로 로그인')
    console.log('2. 클래스를 생성하고 학생을 초대')
    console.log('3. 템플릿을 생성하고 활동을 만들어 테스트')

  } catch (error) {
    console.error('테스트 데이터 생성 중 오류:', error)
  }
}

createTestData()
