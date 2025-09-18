'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  type: 'webinar' | 'workshop' | 'concert';
  customFAQs?: FAQItem[];
}

const defaultFAQs = {
  webinar: [
    {
      question: "What if I can't attend the live session?",
      answer: "Pro and Team package holders will receive access to the full recording within 24 hours of the event. The recording will be available for 30 days."
    },
    {
      question: "Do I need any specific software or tools?",
      answer: "You'll need a modern web browser and internet connection. We'll provide all code examples and resources. A basic understanding of React is recommended but not required."
    },
    {
      question: "Is there a refund policy?",
      answer: "We offer a 100% satisfaction guarantee. If you're not completely satisfied within 7 days of the event, we'll provide a full refund."
    },
    {
      question: "Will I receive a certificate?",
      answer: "Yes! All Pro and Team package attendees will receive a digital certificate of completion that you can add to your LinkedIn profile."
    }
  ],
  workshop: [
    {
      question: "What skill level is required?",
      answer: "This workshop is designed for intermediate to advanced developers. Basic knowledge of React and JavaScript is required."
    },
    {
      question: "Do I need to bring my own laptop?",
      answer: "Yes, please bring a laptop with a modern web browser, code editor, and Node.js installed. We'll provide a setup guide before the workshop."
    },
    {
      question: "Will meals be provided?",
      answer: "Lunch and refreshments are included in the workshop fee. Please let us know about any dietary restrictions when registering."
    },
    {
      question: "Can I get a refund if I can't attend?",
      answer: "Full refunds are available up to 7 days before the workshop. After that, we offer a 50% refund or transfer to a future workshop."
    }
  ],
  concert: [
    {
      question: "What are the age restrictions?",
      answer: "This is an all-ages event. Children under 12 must be accompanied by an adult. VIP areas are 18+ only."
    },
    {
      question: "Can I bring my own food and drinks?",
      answer: "Outside food and beverages are not permitted. We have a variety of food vendors and bars throughout the venue."
    },
    {
      question: "What items are prohibited?",
      answer: "No outside alcohol, glass containers, professional cameras, or recording devices. Full list available on our security page."
    },
    {
      question: "Is there parking available?",
      answer: "Limited paid parking is available on-site for $20/day. We recommend using public transportation or rideshare services."
    }
  ]
};

export function FAQ({ type, customFAQs }: FAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])); // First item open by default
  
  const faqItems = customFAQs || defaultFAQs[type];

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="text-faq-title">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600" data-testid="text-faq-subtitle">
            Everything you need to know about the {type}
          </p>
        </div>
        
        <div className="space-y-6">
          {faqItems.map((faq, index) => {
            const isOpen = openItems.has(index);
            
            return (
              <div 
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                data-testid={`card-faq-${index}`}
              >
                <button 
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  data-testid={`button-faq-${index}`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4" data-testid={`text-faq-question-${index}`}>
                    {faq.question}
                  </h3>
                  <ChevronDown 
                    className={cn(
                      "flex-shrink-0 text-gray-400 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                    size={20}
                    data-testid={`icon-faq-chevron-${index}`}
                  />
                </button>
                
                <div 
                  className={cn(
                    "transition-all duration-200 ease-in-out",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed" data-testid={`text-faq-answer-${index}`}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Have a question that's not answered here?
          </p>
          <a 
            href="mailto:support@example.com"
            className="text-primary hover:text-primary/80 font-medium"
            data-testid="link-contact-support"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
