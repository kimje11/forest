import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key' // Service role key 필요

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupSupabaseAuth() {
  console.log('Supabase Auth 설정을 시작합니다...')

  // 1. 기본 관리자 계정 생성 (선택사항)
  const adminEmail = 'admin@exploration-forest.com'
  const adminPassword = 'admin123!@#'

  try {
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: {
        name: '관리자',
        role: 'ADMIN'
      },
      email_confirm: true // 이메일 확인 생략
    })

    if (adminError && adminError.message !== 'User already registered') {
      console.error('관리자 계정 생성 오류:', adminError)
    } else if (adminUser.user) {
      console.log('관리자 계정이 생성되었습니다:', adminEmail)
      
      // Prisma 데이터베이스에도 동기화
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          id: adminUser.user.id,
          email: adminEmail,
          name: '관리자',
          password: '', // Supabase Auth 사용
          role: 'ADMIN'
        }
      })
    }

    // 2. 기본 교사 계정 생성 (선택사항)
    const teacherEmail = 'teacher@exploration-forest.com'
    const teacherPassword = 'teacher123!@#'

    const { data: teacherUser, error: teacherError } = await supabase.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      user_metadata: {
        name: '기본 교사',
        role: 'TEACHER'
      },
      email_confirm: true
    })

    if (teacherError && teacherError.message !== 'User already registered') {
      console.error('교사 계정 생성 오류:', teacherError)
    } else if (teacherUser.user) {
      console.log('교사 계정이 생성되었습니다:', teacherEmail)
      
      await prisma.user.upsert({
        where: { email: teacherEmail },
        update: {},
        create: {
          id: teacherUser.user.id,
          email: teacherEmail,
          name: '기본 교사',
          password: '',
          role: 'TEACHER'
        }
      })
    }

    console.log('Supabase Auth 설정이 완료되었습니다!')
    console.log('계정 정보:')
    console.log(`관리자: ${adminEmail} / ${adminPassword}`)
    console.log(`교사: ${teacherEmail} / ${teacherPassword}`)

  } catch (error) {
    console.error('Supabase Auth 설정 중 오류:', error)
  }
}

// 스크립트 실행
setupSupabaseAuth()
  .then(() => {
    console.log('설정 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('설정 실패:', error)
    process.exit(1)
  })
