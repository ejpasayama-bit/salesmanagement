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

      const initialFee = leadData.initial_fee || 0;
      const rewardAmount = Math.floor(initialFee * 0.3);
      console.log(`✅ 計算結果 - 初期費用: ${initialFee}円, 報酬額: ${rewardAmount}円`);

      const { error: leadError } = await supabase.from('leads').update({ 
        status: 'WON',
        client_paid_at: new Date().toISOString()
      }).eq('id', leadId);
      
      if (leadError) console.error('❌ Supabase Lead Update Error:', leadError);
      else console.log('✅ leads テーブルの更新成功！');

      const { error: contractError } = await supabase.from('contracts').upsert({
        lead_id: leadId,
        sales_amount: initialFee,
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