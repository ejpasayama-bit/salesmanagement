import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead_id, email, company_name, initial_fee, monthly_fee } = body;

    if (!lead_id || !email) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 'system').single();
    // 🌟 修正：selected_options も一緒に取得する
    const { data: lead } = await supabase.from('leads').select('plan_name, selected_options').eq('id', lead_id).single();
    
    const planName = lead?.plan_name || '';
    const taxRateId = process.env.STRIPE_TAX_RATE_ID;
    const taxRates = taxRateId ? [taxRateId] : undefined;

    let initialProductId = process.env.STRIPE_PROD_INITIAL_UME!;
    let monthlyProductId = process.env.STRIPE_PROD_MONTHLY_UME!;

    if (planName.includes('松')) {
      initialProductId = process.env.STRIPE_PROD_INITIAL_MATSU!;
      monthlyProductId = process.env.STRIPE_PROD_MONTHLY_MATSU!;
    } else if (planName.includes('竹')) {
      initialProductId = process.env.STRIPE_PROD_INITIAL_TAKE!;
      monthlyProductId = process.env.STRIPE_PROD_MONTHLY_TAKE!;
    }

    // 🌟 追加：請求項目の配列を動的に組み立てる
    const addInvoiceItems: any[] = [];

    // ① 基本の初期費用
    if (Number(initial_fee) > 0) {
      addInvoiceItems.push({
        price_data: { 
          currency: 'jpy', 
          product: initialProductId, 
          unit_amount: Number(initial_fee) 
        },
        tax_rates: taxRates,
      });
    }

    // ② オプションごとの費用を追加
    const options = lead?.selected_options || [];
    options.forEach((opt: any) => {
      if (Number(opt.price) > 0) {
        addInvoiceItems.push({
          price_data: { 
            currency: 'jpy', 
            product_data: {
              name: `【オプション】${opt.name}`
            },
            unit_amount: Number(opt.price) 
          },
          tax_rates: taxRates,
        });
      }
    });

    const subscription = await stripe.subscriptions.create({
      customer: (await stripe.customers.create({
        email, name: company_name, metadata: { lead_id }
      })).id,
      default_tax_rates: taxRates,
      items: [{
        price_data: { 
          currency: 'jpy', 
          product: monthlyProductId, 
          unit_amount: Number(monthly_fee), 
          recurring: { interval: 'month' } 
        },
      }],
      // 🌟 修正：組み立てた配列を追加
      ...(addInvoiceItems.length > 0 && { add_invoice_items: addInvoiceItems }),
      trial_end: Math.floor(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() / 1000),
      metadata: { lead_id },
      collection_method: 'send_invoice',
      days_until_due: 30,
    });

    if (subscription.latest_invoice) {
      const invoiceId = subscription.latest_invoice as string;
      
      const invoice = await stripe.invoices.finalizeInvoice(invoiceId);
      await stripe.invoices.sendInvoice(invoiceId);

      const dueDateIso = invoice.due_date 
        ? new Date(invoice.due_date * 1000).toISOString() 
        : null;

      await supabase.from('leads').update({ 
        invoiced_at: new Date().toISOString(),
        stripe_invoice_id: invoice.id,
        stripe_due_date: dueDateIso
      }).eq('id', lead_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}