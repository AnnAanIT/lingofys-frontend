import React, { useState } from 'react';
import {
  Button,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Input, TextArea, Select,
  Badge,
  Alert,
  Modal, ModalFooter, ConfirmModal,
  Skeleton, SkeletonCard, SkeletonTable,
  Spinner, PageLoader, SectionLoader,
  EmptyState,
  useToast
} from '../components/ui';
import {
  Plus, Mail, Save, Trash2, Edit, Download,
  User, Calendar, MessageSquare, Inbox, Search
} from 'lucide-react';

export const UITest: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, success, error, info, warning } = useToast();

  const handleTestToast = () => {
    success('Success!', 'This is a success message with progress bar');
  };

  const handleTestError = () => {
    error('Error!', 'This is an error message');
  };

  const handleTestInfo = () => {
    info('Information', 'This is an info message');
  };

  const handleTestWarning = () => {
    warning('Warning!', 'This is a warning message');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">UI Component Test Page</h1>
          <p className="text-slate-600">Test all new UI/UX improvements</p>
        </div>

        {/* Buttons Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>All button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variants */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Variants</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">With Icons</h4>
              <div className="flex flex-wrap gap-3">
                <Button icon={<Plus className="w-4 h-4" />} iconPosition="left">
                  Add New
                </Button>
                <Button variant="outline" icon={<Save className="w-4 h-4" />}>
                  Save
                </Button>
                <Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>
                  Delete
                </Button>
              </div>
            </div>

            {/* Loading State */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Loading State</h4>
              <Button loading>Processing...</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Inputs Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
            <CardDescription>Input, TextArea, and Select components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Normal Input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              helperText="We'll never share your email"
              fullWidth
            />

            {/* Input with Error */}
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              error="Password must be at least 8 characters"
              fullWidth
              required
            />

            {/* Input with Success */}
            <Input
              label="Username"
              type="text"
              defaultValue="john_doe"
              success="Username is available"
              leftIcon={<User className="w-5 h-5" />}
              fullWidth
            />

            {/* Select */}
            <Select
              label="Country"
              options={[
                { value: '', label: 'Select a country' },
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'ca', label: 'Canada' },
                { value: 'au', label: 'Australia' },
              ]}
              helperText="Select your country of residence"
              fullWidth
            />

            {/* TextArea */}
            <TextArea
              label="Message"
              placeholder="Enter your message..."
              rows={4}
              helperText="Maximum 500 characters"
              fullWidth
            />
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">With Dot</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" dot>Active</Badge>
                  <Badge variant="warning" dot>Pending</Badge>
                  <Badge variant="danger" dot>Cancelled</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Notification messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="info" title="Information">
              This is an informational message.
            </Alert>

            <Alert variant="success" title="Success!">
              Your changes have been saved successfully.
            </Alert>

            <Alert variant="warning" title="Warning">
              Your session will expire in 5 minutes.
            </Alert>

            <Alert variant="danger" title="Error" onClose={() => {}}>
              Failed to connect to server. Please try again.
            </Alert>
          </CardContent>
        </Card>

        {/* Loading States Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Spinners and skeleton screens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Spinners */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Spinners</h4>
              <div className="flex flex-wrap items-center gap-8">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <Spinner size="lg" label="Loading..." />
              </div>
            </div>

            {/* Skeleton Card */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Skeleton Card</h4>
              <SkeletonCard />
            </div>

            {/* Skeleton Table */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Skeleton Table</h4>
              <SkeletonTable rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Empty State Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Empty State</CardTitle>
            <CardDescription>When no data is available</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Inbox}
              title="No messages yet"
              description="When you receive messages, they'll appear here."
              action={{
                label: "Start a conversation",
                onClick: () => success('Conversation started!'),
                icon: <MessageSquare className="w-4 h-4" />
              }}
            />
          </CardContent>
        </Card>

        {/* Toasts Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Click buttons to test toast notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" onClick={handleTestToast}>
                Show Success Toast
              </Button>
              <Button variant="danger" onClick={handleTestError}>
                Show Error Toast
              </Button>
              <Button variant="primary" onClick={handleTestInfo}>
                Show Info Toast
              </Button>
              <Button variant="outline" onClick={handleTestWarning}>
                Show Warning Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modals Section */}
        <Card variant="elevated" className="animate-slide-up">
          <CardHeader>
            <CardTitle>Modals</CardTitle>
            <CardDescription>Dialog windows and confirmations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowModal(true)}>
                Open Modal
              </Button>
              <Button variant="danger" onClick={() => setShowConfirm(true)}>
                Open Confirm Dialog
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Variants Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          <Card variant="default" hover>
            <CardContent>
              <h3 className="font-semibold mb-2">Default Card</h3>
              <p className="text-sm text-slate-600">With hover effect</p>
            </CardContent>
          </Card>

          <Card variant="bordered" hover>
            <CardContent>
              <h3 className="font-semibold mb-2">Bordered Card</h3>
              <p className="text-sm text-slate-600">With hover effect</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent>
              <h3 className="font-semibold mb-2">Elevated Card</h3>
              <p className="text-sm text-slate-600">With shadow</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent>
              <h3 className="font-semibold mb-2">Glass Card</h3>
              <p className="text-sm text-slate-600">With backdrop blur</p>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        description="This is a modal dialog with backdrop blur"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Enter your name"
            fullWidth
          />
          <TextArea
            label="Comments"
            placeholder="Enter your comments..."
            rows={4}
            fullWidth
          />
        </div>
        <ModalFooter className="mt-6">
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowModal(false);
              success('Form submitted!', 'Your information has been saved.');
            }}
          >
            Submit
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            setShowConfirm(false);
            success('Deleted!', 'Item has been deleted successfully.');
          }, 1500);
        }}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading}
      />
    </div>
  );
};
