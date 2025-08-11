
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Gavel, Video, Gamepad2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const rulesEn = [
  {
    icon: Video,
    title: 'Screen Recording is Mandatory',
    content: 'Both players must screen record the entire match, from room creation to the final result screen. This is your primary proof in case of disputes.',
  },
  {
    icon: Gamepad2,
    title: 'Match Settings',
    content: 'Matches are 12 minutes with Penalties ON by default. If you want a different duration, you must state it clearly in the match description before anyone joins.',
  },
  {
    icon: FileText,
    title: 'Result Submission',
    content: 'Both winner and loser must submit a screenshot of the final score within 1 hour of the match starting. If only one player submits, their result will be considered final.',
  },
  {
    icon: AlertTriangle,
    title: 'Disconnections & Disputes',
    content: 'If a player disconnects, the player whose screen shows a win will be declared the winner. For complex issues, use the "Need Help" button to contact support with your video proof. Admin decisions are final.',
  },
];

const rulesBn = [
    {
      icon: Video,
      title: 'স্ক্রিন রেকর্ডিং বাধ্যতামূলক',
      content: 'উভয় খেলোয়াড়কে অবশ্যই রুম তৈরি থেকে শুরু করে চূড়ান্ত ফলাফল স্ক্রিন পর্যন্ত পুরো ম্যাচটি স্ক্রিন রেকর্ড করতে হবে। বিরোধের ক্ষেত্রে এটি আপনার প্রাথমিক প্রমাণ।',
    },
    {
      icon: Gamepad2,
      title: 'ম্যাচের সেটিংস',
      content: 'ম্যাচ ডিফল্টভাবে ১২ মিনিট এবং পেনাল্টি চালু থাকবে। আপনি যদি ভিন্ন সময়সীমার ম্যাচ খেলতে চান, তবে যোগদানের আগে অবশ্যই ম্যাচের বিবরণে তা উল্লেখ করতে হবে।',
    },
    {
      icon: FileText,
      title: 'ফলাফল জমা দেওয়া',
      content: 'ম্যাচ শুরুর ১ ঘণ্টার মধ্যে বিজয়ী এবং পরাজিত উভয়কেই চূড়ান্ত স্কোরের একটি স্ক্রিনশট জমা দিতে হবে। যদি শুধুমাত্র একজন খেলোয়াড় জমা দেন, তবে তার ফলাফলই চূড়ান্ত বলে বিবেচিত হবে।',
    },
    {
      icon: AlertTriangle,
      title: 'ডিসকানেকশন এবং বিরোধ',
      content: 'যদি কোনও খেলোয়াড় সংযোগ বিচ্ছিন্ন হয়ে যায়, যার স্ক্রিনে জয় দেখানো হবে তাকেই বিজয়ী ঘোষণা করা হবে। জটিল সমস্যার জন্য, আপনার ভিডিও প্রমাণ সহ সাপোর্টে যোগাযোগ করতে "Need Help" বোতামটি ব্যবহার করুন। অ্যাডমিনের সিদ্ধান্তই চূড়ান্ত।',
    },
  ];

export default function RulesPage() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const rules = language === 'en' ? rulesEn : rulesBn;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
          <Gavel className="h-6 w-6" />
          <h1 className="text-xl font-headline font-bold">Rules & System</h1>
        </div>
        <div className="flex items-center gap-2">
            <Tabs value={language} onValueChange={setLanguage} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="bn">বাংলা</TabsTrigger>
                </TabsList>
            </Tabs>
            <Button onClick={() => router.push('/')} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Home
            </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Game Rules' : 'খেলার নিয়মাবলী'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {rules.map((rule, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3">
                        <rule.icon className="h-5 w-5 text-primary" />
                        {rule.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground pl-10">
                    {rule.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
