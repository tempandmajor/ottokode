'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { USER_AGREEMENT_CONTENT } from '@/lib/user-agreement-content';

interface UserAgreementModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isDesktop?: boolean;
  canDecline?: boolean;
}

export function UserAgreementModal({
  open,
  onAccept,
  onDecline,
  isDesktop = false,
  canDecline = true
}: UserAgreementModalProps) {
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    logger.debug('Scroll event', { scrollTop, scrollHeight, clientHeight });

    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    logger.debug('Is at bottom', isAtBottom);

    if (isAtBottom && !isScrolledToBottom) {
      logger.debug('Setting scrolled to bottom = true');
      setIsScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (hasReadAgreement && isScrolledToBottom) {
      onAccept();
    }
  };

  const canAccept = hasReadAgreement && isScrolledToBottom;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {USER_AGREEMENT_CONTENT.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Version {USER_AGREEMENT_CONTENT.version}</Badge>
              <Badge variant="outline">{USER_AGREEMENT_CONTENT.lastUpdated}</Badge>
            </div>
          </div>
          <DialogDescription>
            {isDesktop
              ? "Please read and accept the following terms to continue using Ottokode."
              : "Please review our user agreement and terms of service."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div
            className="max-h-[60vh] border rounded-md p-4 overflow-y-auto overscroll-contain"
            onScroll={handleScroll}
          >
            <div className="space-y-6">
              {USER_AGREEMENT_CONTENT.sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                  {index < USER_AGREEMENT_CONTENT.sections.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">SUMMARY</h3>
                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                  {USER_AGREEMENT_CONTENT.summary}
                </div>

                <div className="text-xs text-muted-foreground">
                  {USER_AGREEMENT_CONTENT.contactInfo}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="read-agreement"
              checked={hasReadAgreement}
              onCheckedChange={(checked) => setHasReadAgreement(checked as boolean)}
            />
            <label
              htmlFor="read-agreement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and understand the terms of this agreement
            </label>
          </div>

          {!isScrolledToBottom && (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
              Please scroll to the bottom of the agreement to continue.
              <button
                onClick={() => setIsScrolledToBottom(true)}
                className="ml-2 underline text-xs"
                type="button"
              >
                (Debug: Mark as scrolled)
              </button>
            </div>
          )}

          <DialogFooter className="gap-2">
            {canDecline && (
              <Button
                variant="outline"
                onClick={onDecline}
                className="min-w-[100px]"
              >
                {isDesktop ? "Exit" : "Cancel"}
              </Button>
            )}
            <Button
              onClick={handleAccept}
              disabled={!canAccept}
              className="min-w-[100px]"
            >
              Accept & Continue
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}