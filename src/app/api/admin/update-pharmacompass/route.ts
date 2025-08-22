import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('department, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.department !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // PharmaCompass 크롤러 실행
    const crawlerPath = path.join(process.cwd(), '..', 'cphi_crawler_toolkit', 'pharmacompass_production_crawler.py');
    
    return new Promise<Response>((resolve) => {
      const pythonProcess = spawn('python', [crawlerPath], {
        cwd: path.join(process.cwd(), '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ 
            success: true, 
            message: 'PharmaCompass 데이터 업데이트가 완료되었습니다.',
            output: output
          }));
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            error: 'PharmaCompass 크롤링 실행 중 오류가 발생했습니다.',
            output: output,
            errorOutput: errorOutput
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (error) => {
        resolve(NextResponse.json({ 
          success: false, 
          error: `크롤러 실행 실패: ${error.message}`
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('PharmaCompass 업데이트 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

// 크롤링 상태 확인을 위한 GET 메서드
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('department, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.department !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 현재 데이터베이스 상태 확인
    const { data: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .like('product_url', '%pharmacompass%');

    const { data: suppliersCount, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .like('supplier_url', '%pharmacompass%');

    if (productsError || suppliersError) {
      return NextResponse.json({ 
        error: '데이터 조회 오류' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        pharmacompass_products: productsCount,
        pharmacompass_suppliers: suppliersCount,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('PharmaCompass 상태 조회 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}