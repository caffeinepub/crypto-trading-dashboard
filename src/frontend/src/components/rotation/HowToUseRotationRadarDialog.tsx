import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';

export function HowToUseRotationRadarDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          How to Use
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>How to Use Market Rotation Radar</DialogTitle>
          <DialogDescription>
            Learn how to identify rotation opportunities and track capital flows
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="buckets">
                <AccordionTrigger>What are Rotation Buckets?</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p className="text-sm">
                    The market is divided into five segments based on market cap:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li><Badge variant="outline">BTC</Badge> Bitcoin only</li>
                    <li><Badge variant="outline">ETH</Badge> Ethereum only</li>
                    <li><Badge variant="outline">Majors</Badge> Top 3-10 by market cap</li>
                    <li><Badge variant="outline">Mid-caps</Badge> Top 11-30 by market cap</li>
                    <li><Badge variant="outline">Micro-caps</Badge> Top 31-100 by market cap</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="phases">
                <AccordionTrigger>Understanding Market Phases</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p className="text-sm">
                    The radar identifies six distinct market phases:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li><strong>BTC Dominance:</strong> Bitcoin leading, altcoins lagging</li>
                    <li><strong>BTC Accumulation:</strong> Bitcoin slowly accumulating</li>
                    <li><strong>Rotation to ETH:</strong> Capital flowing from BTC to ETH and majors</li>
                    <li><strong>Altcoin Season:</strong> Majors and mid-caps outperforming</li>
                    <li><strong>Risk-Off:</strong> Broad market decline</li>
                    <li><strong>Consolidation:</strong> Mixed signals, no clear trend</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="confidence">
                <AccordionTrigger>What is Confidence Score?</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p className="text-sm">
                    Confidence indicates how strongly the data supports the current phase:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li><strong>75-100%:</strong> Strong signals, high conviction</li>
                    <li><strong>50-74%:</strong> Moderate signals, watch closely</li>
                    <li><strong>Below 50%:</strong> Weak signals, phase transition possible</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="leaders">
                <AccordionTrigger>Using Flow & Leaders</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p className="text-sm">
                    The Flow & Leaders view helps you identify:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>Top performers (leaders) in each bucket</li>
                    <li>Underperformers (laggards) showing weakness</li>
                    <li>Correlation with BTC (rotation signals)</li>
                    <li>Relative strength vs BTC</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Click any coin to see detailed analysis and trade zones.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="glossary">
                <AccordionTrigger>Glossary</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="font-semibold">Breadth</dt>
                      <dd className="text-muted-foreground">Percentage of coins in a bucket with positive 24h change</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Relative Performance</dt>
                      <dd className="text-muted-foreground">Performance compared to Bitcoin (positive = outperforming BTC)</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Correlation</dt>
                      <dd className="text-muted-foreground">How closely a coin moves with Bitcoin (0-100%)</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Divergence</dt>
                      <dd className="text-muted-foreground">When a bucket moves differently from BTC (rotation signal)</dd>
                    </div>
                  </dl>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="p-4 rounded-lg bg-muted/50 text-sm">
              <p className="font-semibold mb-2">Important Note:</p>
              <p className="text-muted-foreground">
                Market Rotation Radar is an analytical tool. It does not provide financial advice or guarantee trading outcomes. Always conduct your own research and manage risk appropriately.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
