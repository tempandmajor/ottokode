"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserAgreementModal } from '@/components/legal/user-agreement-modal';
import { USER_AGREEMENT_CONTENT } from '@/lib/user-agreement-content';
import { useUserAgreementStore } from '@/stores/user-agreement-store';
import { Check, FileText, Calendar, Users } from 'lucide-react';

export default function UserAgreementPage() {
  const [showModal, setShowModal] = useState(false);
  const { hasAcceptedAgreement, acceptedAt, acceptedVersion } = useUserAgreementStore();

  const handleViewAgreement = () => {
    setShowModal(true);
  };

  const handleAcceptAgreement = () => {
    useUserAgreementStore.getState().acceptAgreement();
    setShowModal(false);
  };

  const handleDeclineAgreement = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
            User Agreement
          </h1>
          <p className="text-lg text-muted-foreground">
            Review and manage your acceptance of the Ottokode User Agreement.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Agreement Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasAcceptedAgreement ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <FileText className="h-5 w-5 text-amber-500" />
                )}
                Agreement Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={hasAcceptedAgreement ? "default" : "secondary"}>
                    {hasAcceptedAgreement ? "Accepted" : "Not Accepted"}
                  </Badge>
                  <Badge variant="outline">
                    Version {USER_AGREEMENT_CONTENT.version}
                  </Badge>
                </div>

                {hasAcceptedAgreement && acceptedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Accepted on {new Date(acceptedAt).toLocaleDateString()} at{' '}
                      {new Date(acceptedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {hasAcceptedAgreement && acceptedVersion && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Accepted Version: {acceptedVersion}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agreement Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Agreement Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Current Version</div>
                    <div className="text-sm text-muted-foreground">
                      {USER_AGREEMENT_CONTENT.version}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Last Updated</div>
                    <div className="text-sm text-muted-foreground">
                      {USER_AGREEMENT_CONTENT.lastUpdated}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="font-medium">Applies To</div>
                    <div className="text-sm text-muted-foreground">
                      All Users
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-medium">Key Topics Covered:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>• License Grant & Usage Rights</div>
                    <div>• AI Services & Data Processing</div>
                    <div>• Privacy & Data Collection</div>
                    <div>• Subscription & Payment Terms</div>
                    <div>• Intellectual Property Rights</div>
                    <div>• Service Limitations & Disclaimers</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleViewAgreement} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Agreement
                </Button>

                {!hasAcceptedAgreement && (
                  <Button variant="outline" onClick={handleViewAgreement} className="flex-1">
                    Accept Agreement
                  </Button>
                )}

                <Button variant="outline" asChild className="flex-1">
                  <a href="/terms" target="_blank">
                    <FileText className="h-4 w-4 mr-2" />
                    Terms of Service
                  </a>
                </Button>

                <Button variant="outline" asChild className="flex-1">
                  <a href="/privacy" target="_blank">
                    <FileText className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <strong className="text-blue-800 dark:text-blue-200">Desktop App Users:</strong>
                  <span className="text-blue-700 dark:text-blue-300 ml-1">
                    You must accept this agreement before using the desktop version of Ottokode.
                  </span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <strong className="text-amber-800 dark:text-amber-200">Version Updates:</strong>
                  <span className="text-amber-700 dark:text-amber-300 ml-1">
                    When we update this agreement, you may need to accept the new version to continue using certain features.
                  </span>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                  <strong className="text-green-800 dark:text-green-200">Questions?</strong>
                  <span className="text-green-700 dark:text-green-300 ml-1">
                    Contact us at legal@ottokode.ai if you have questions about this agreement.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <UserAgreementModal
          open={showModal}
          onAccept={handleAcceptAgreement}
          onDecline={handleDeclineAgreement}
          isDesktop={false}
          canDecline={true}
        />
      </div>
    </div>
  );
}