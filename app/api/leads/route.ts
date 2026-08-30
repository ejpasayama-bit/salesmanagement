import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { partner_id, client_company, client_contact, client_email, plan_name, initial_fee, monthly_fee, selected_options, remarks } = body;

    if (!partner_id) {
       return NextResponse.json({ error: 'パートナーIDが必要です' }, { status: 400 });
    }

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        partner_id, 
        client_company,
        client_contact,
        client_email,
        plan_name: plan_name || null,
        initial_fee: initial_fee || 0,
        monthly_fee: monthly_fee || 0,
        selected_options: selected_options || [],
        remarks: remarks || '',
        status: 'PENDING'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      // 🌟 追加：メールに差し込むためのパートナー（紹介者）の情報を取得
      const { data: partner } = await supabase
        .from('partners')
        .select('company_name')
        .eq('id', partner_id)
        .single();
      
      const partnerName = partner?.company_name || 'パートナー';

      const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 'system').single();
      
      if (settings && settings.sender_email) {
        const isPlanDecided = !!plan_name;
        const rawTemplate = isPlanDecided ? settings.template_plan_decided : settings.template_plan_undecided;
        const subject = isPlanDecided ? '【ご案内】お見積もり作成につきまして' : '【ご案内】今後の流れにつきまして';

        // 🌟 修正：{partner} を紹介者の会社名に変換 ＆ \n を実際の改行コードに変換
        const emailBody = rawTemplate
          .replace(/{company}/g, client_company)
          .replace(/{name}/g, client_contact)
          .replace(/{plan}/g, plan_name || '未定')
          .replace(/{partner}/g, partnerName)
          .replace(/\\n/g, '\n');

        await resend.emails.send({
          from: settings.sender_email,
          to: client_email,
          subject: subject,
          text: emailBody,
        });
        console.log('✅ Resend経由で初回案内メールを送信しました');
      }
    } catch (emailError) {
      console.error('メール送信エラー:', emailError);
    }

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error('Lead Insert Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        partners ( company_name ),
        contracts ( payment_status, reward_amount )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data.map(lead => ({
      ...lead,
      contracts: lead.contracts ? (Array.isArray(lead.contracts) ? lead.contracts : [lead.contracts]) : []
    }));

    return NextResponse.json({ success: true, leads: formattedData });
  } catch (error: any) {
    console.error('Lead Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}