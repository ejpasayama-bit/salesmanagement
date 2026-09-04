import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('🔔 Webhook受信:', event.type);

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as any;
    console.log('✅ invoice.paid イベント処理開始。サブスクリプションID:', invoice.subscription);

    let leadId = invoice.metadata?.lead_id;

    if (!leadId && invoice.subscription) {
      const subscription: any = await stripe.subscriptions.retrieve(invoice.subscription as string);
      leadId = subscription.metadata?.lead_id;
    }

    if (!leadId && typeof invoice.customer === 'string') {
      const customerData: any = await stripe.customers.retrieve(invoice.customer);
      if (!customerData.deleted) {
        leadId = customerData.metadata?.lead_id;
      }
    }

    console.log('✅ 取得したリードID:', leadId);

    if (leadId) {
      const amountPaid = invoice.amount_paid; 
      if (amountPaid === 0) {
          console.log('⚠️ 支払額が0円のため、報酬計算をスキップします');
          return NextResponse.json({ received: true });
      }

      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
        
      if (fetchError || !leadData) {
        console.error('❌ リード情報の取得に失敗:', fetchError);
        return NextResponse.json({ received: true });
      }

      // 🌟 システム設定から消費税率を取得
      const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 'system').single();
      const taxRate = settings?.tax_rate !== undefined ? settings.tax_rate / 100 : 0.1;

      // 🌟 修正：初期費用＋オプションの「税抜合計」を算出
      const options = leadData.selected_options || [];
      const optionsTotalFee = options.reduce((sum: number, opt: any) => sum + (Number(opt.price) || 0), 0);
      const baseInitialFee = leadData.initial_fee || 0;
      const subtotal = baseInitialFee + optionsTotalFee; // 税抜合計

      // 🌟 修正：税込総額を算出し、その50%を紹介料とする
      const initialTax = Math.floor(subtotal * taxRate);
      const totalAmountInclTax = subtotal + initialTax; // 税込合計
      
      const rewardAmount = Math.floor(totalAmountInclTax * 0.5); // 税込総額の50%

      console.log(`✅ 計算結果 - 税抜小計: ${subtotal}円, 税込合計: ${totalAmountInclTax}円, 報酬額(50%): ${rewardAmount}円`);

      const { error: leadError } = await supabase.from('leads').update({ 
        status: 'WON',
        client_paid_at: new Date().toISOString()
      }).eq('id', leadId);
      
      if (leadError) console.error('❌ Supabase Lead Update Error:', leadError);
      else console.log('✅ leads テーブルの更新成功！');

      const { error: contractError } = await supabase.from('contracts').upsert({
        lead_id: leadId,
        sales_amount: totalAmountInclTax, // 記録上の売上も税込総額に変更
        reward_amount: rewardAmount,
        stripe_invoice_id: invoice.id,
        payment_status: 'PAID_BY_CLIENT',
        partner_payment_status: 'UNPAID'
      }, { onConflict: 'lead_id' }); 

      if (contractError) console.error('❌ Supabase Contract Insert Error:', contractError);
      else console.log('✅ contracts テーブルの追加・更新成功！');
      
    } else {
      console.log('⚠️ 注意: lead_id が見つからなかったため、DB書き込みをスキップしました');
    }
  }

  return NextResponse.json({ received: true });
}