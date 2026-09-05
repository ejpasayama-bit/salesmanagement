import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { lead_id, updates } = await req.json();

    if (!lead_id || !updates) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    const dateFields = ['delivery_deadline', 'estimate_sent_at', 'started_at', 'invoiced_at', 'client_paid_at'];
    for (const field of dateFields) {
      if (updates[field] === '') {
        updates[field] = null;
      }
    }

    const { error } = await supabase.from('leads').update(updates).eq('id', lead_id);
    if (error) throw error;

    if (updates.estimate_status === 'SENT') {
      const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single();
      const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 'system').single();

      if (lead && settings) {
        const options = lead.selected_options || [];
        const optionsTotalFee = options.reduce((sum: number, opt: any) => sum + (Number(opt.price) || 0), 0);

        const baseInitialFee = lead.initial_fee || 0;
        const initialFee = baseInitialFee + optionsTotalFee;
        
        const monthlyFee = lead.monthly_fee || 0;
        const taxRate = settings.tax_rate !== undefined ? settings.tax_rate / 100 : 0.1;
        
        const initialTax = Math.floor(initialFee * taxRate);
        const initialTotal = initialFee + initialTax;
        
        const monthlyTax = Math.floor(monthlyFee * taxRate);
        const monthlyTotal = monthlyFee + monthlyTax;

        // 🌟 修正：プラン名による納期の自然な文章への分岐
        const planName = lead.plan_name || '';
        const deliveryNote = planName.includes('松') 
          ? 'アプリを1から開発するため要相談' 
          : 'お返事を頂いてから約1ヶ月頂戴いたします。';
        
        // フォントの読み込み
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.ttf');
        const fontBuffer = await fs.readFile(fontPath);
        const fontBase64 = fontBuffer.toString('base64');

        const doc = new jsPDF();
        doc.addFileToVFS('NotoSansJP-Regular.ttf', fontBase64);
        doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
        doc.setFont('NotoSansJP');
        
        // --- ① ヘッダー部分 ---
        doc.setFillColor(65, 105, 225);
        doc.rect(15, 15, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('見 積 書', 105, 22, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        const today = new Date();
        doc.text(`見積日:  ${today.toLocaleDateString('ja-JP')}`, 145, 35);
        doc.text(`見積番号:  EST-${today.getFullYear()}${String(today.getMonth()+1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${lead.id.substring(0,4).toUpperCase()}`, 145, 42);

        // --- ② 宛先と自社情報 ---
        doc.setFontSize(14);
        doc.text(`${lead.client_company} 御中`, 15, 50);
        
        const myCompany = "EJwFukaya";
        const myAddress = "〒101-0041\n東京都千代田区神田須田町1丁目7番8号\nVORT秋葉原Ⅳ 2F";
        const myEmail = settings.sender_email || "local@easyjstudio.com";
        
        doc.setFontSize(12);
        doc.text(myCompany, 120, 50);
        doc.setFontSize(9);
        doc.text(myAddress, 120, 57);
        doc.text(`Email: ${myEmail}`, 120, 70);

        doc.setFontSize(10);
        doc.text('下記の通り、お見積り申し上げます。', 15, 75);

        // --- ③ 見積合計金額（初期費用 ＆ 保守費用） ---
        doc.setFillColor(65, 105, 225);
        doc.rect(15, 85, 85, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('お見積金額・初期費用（税込）', 57.5, 90, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.rect(15, 93, 85, 12);
        doc.setFontSize(16);
        doc.text(`¥ ${initialTotal.toLocaleString()}`, 57.5, 101, { align: 'center' });

        doc.setFillColor(65, 105, 225);
        doc.rect(105, 85, 90, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('お見積金額・保守費用（税込）', 150, 90, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.rect(105, 93, 90, 12);
        doc.setFontSize(16);
        doc.text(`¥ ${monthlyTotal.toLocaleString()} / 月`, 150, 101, { align: 'center' });

        // --- ④ 納期・条件 ---
        doc.setFontSize(9);
        autoTable(doc, {
          startY: 115,
          margin: { left: 15 },
          tableWidth: 90,
          theme: 'grid',
          styles: { font: 'NotoSansJP', fontSize: 9 },
          columnStyles: { 0: { fillColor: [65, 105, 225], textColor: 255, cellWidth: 25 } }, 
          body: [
            ['支払条件', 'クレジットカード決済'],
            ['有効期限', '本見積発行日より30日間'],
          ],
        });

        const tableBody = [];
        
        if (baseInitialFee > 0) {
          tableBody.push([`【初期開発】${lead.plan_name}`, '1', '式', `¥ ${baseInitialFee.toLocaleString()}`, `${taxRate * 100}%`, `¥ ${baseInitialFee.toLocaleString()}`]);
        }
        
        options.forEach((opt: any) => {
          const optPrice = Number(opt.price) || 0;
          tableBody.push([`【オプション】${opt.name}`, '1', '式', `¥ ${optPrice.toLocaleString()}`, `${taxRate * 100}%`, `¥ ${optPrice.toLocaleString()}`]);
        });

        while (tableBody.length < 3) {
          tableBody.push(['', '', '', '', '', '']);
        }

        // --- ⑤ 明細表（テーブル） ---
        autoTable(doc, {
          startY: 145,
          theme: 'grid',
          styles: { font: 'NotoSansJP', fontSize: 9 },
          headStyles: { fillColor: [65, 105, 225], textColor: 255, halign: 'center', fontStyle: 'normal' },
          columnStyles: { 
            0: { cellWidth: 80 },
            1: { halign: 'right' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'center' },
            5: { halign: 'right' }
          },
          head: [['内容', '数量', '単位', '単価 (税抜)', '税率', '金額 (税抜)']],
          body: tableBody,
        });

        const finalY = (doc as any).lastAutoTable.finalY;

        // --- ⑥ 小計・消費税・合計 ---
        autoTable(doc, {
          startY: finalY + 5,
          margin: { left: 135 },
          tableWidth: 60,
          theme: 'grid',
          styles: { font: 'NotoSansJP', fontSize: 9, halign: 'right' },
          columnStyles: { 0: { fillColor: [65, 105, 225], textColor: 255, halign: 'center', cellWidth: 25 } },
          body: [
            ['小計', `¥ ${initialFee.toLocaleString()}`],
            ['消費税', `¥ ${initialTax.toLocaleString()}`],
            ['合計', `¥ ${initialTotal.toLocaleString()}`],
          ],
        });

        // --- ⑦ 備考欄 ---
        const remarksY = finalY + 35;
        doc.setFillColor(65, 105, 225);
        doc.rect(15, remarksY, 180, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('備考', 105, remarksY + 4, { align: 'center' });
        
        doc.setDrawColor(0, 0, 0);
        doc.rect(15, remarksY + 6, 180, 22);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        
        // 🌟 修正：先頭に固定の文字をつけず、変数の中身をそのまま出力
        doc.text(`・納品予定：${deliveryNote}`, 18, remarksY + 12);
        doc.text('・お申込後のキャンセルは不可となりますので、あらかじめご了承ください。', 18, remarksY + 18);
        doc.setTextColor(220, 53, 69);
        doc.text(`・運用保守費用として月額 ¥ ${monthlyFee.toLocaleString()} (税抜) が発生いたします。`, 18, remarksY + 24);

        // PDFの出力
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        const emailBody = `${lead.client_company} 様\n\n` +
          `お世話になっております。\n` +
          `ご依頼いただいておりました「${lead.plan_name}」のお見積書をPDFにて添付ご案内いたします。\n\n` +
          `内容をご確認いただき、よろしければご返信いただけますと幸いです。\n` +
          `何卒よろしくお願い申し上げます。`;

        await resend.emails.send({
          from: settings.sender_email || 'local@easyjstudio.com',
          to: lead.client_email,
          bcc: settings.sender_email || 'local@easyjstudio.com',
          subject: `【お見積書】${lead.plan_name} のご提案`,
          text: emailBody,
          attachments: [
            {
              filename: `見積書_${lead.client_company}様.pdf`,
              content: pdfBuffer,
            },
          ],
        });
        console.log('✅ テーブルレイアウトのPDF見積書を送信しました');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Lead Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}