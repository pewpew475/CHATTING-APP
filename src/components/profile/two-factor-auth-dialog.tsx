"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"
import { UserSettingsService, type TwoFactorSettings } from "@/lib/user-settings-service"

interface TwoFactorAuthDialogProps {
  children: React.ReactNode
}

// TwoFactorSettings interface is now imported from user-settings-service

export function TwoFactorAuthDialog({ children }: TwoFactorAuthDialogProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"overview" | "setup-app" | "setup-sms" | "verify" | "backup-codes">("overview")
  const [verificationCode, setVerificationCode] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [settings, setSettings] = useState<TwoFactorSettings>({
    isEnabled: false,
    method: null,
    backupCodes: [],
    phoneNumber: "",
    lastUsed: undefined
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id && isOpen) {
        // Load saved settings from database
        const savedSettings = await UserSettingsService.get2FASettings(user.id)
        if (savedSettings) {
          setSettings(savedSettings)
        }
      }
    }
    loadSettings()
  }, [user?.id, isOpen])

  const generateBackupCodes = () => {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  const generateQRCode = async () => {
    // Simulate QR code generation
    setSecretKey("JBSWY3DPEHPK3PXP")
    setQrCode("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4K")
  }

  const handleSetupApp = async () => {
    setIsLoading(true)
    try {
      await generateQRCode()
      setStep("setup-app")
    } catch (error) {
      toast.error("Failed to generate QR code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupSMS = () => {
    setStep("setup-sms")
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, accept any 6-digit code
      const backupCodes = generateBackupCodes()
      const newSettings: TwoFactorSettings = {
        isEnabled: true,
        method: step === "setup-app" ? "app" : "sms",
        backupCodes,
        phoneNumber: step === "setup-sms" ? phoneNumber : undefined,
        lastUsed: new Date().toISOString()
      }
      
      setSettings(newSettings)
      if (user?.id) {
        await UserSettingsService.save2FASettings(user.id, newSettings)
      }
      
      setStep("backup-codes")
      toast.success("Two-factor authentication enabled successfully!")
    } catch (error) {
      toast.error("Invalid verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return
    }

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newSettings: TwoFactorSettings = {
        isEnabled: false,
        method: null,
        backupCodes: [],
        phoneNumber: "",
        lastUsed: undefined
      }
      
      setSettings(newSettings)
      if (user?.id) {
        await UserSettingsService.save2FASettings(user.id, newSettings)
      }
      
      toast.success("Two-factor authentication disabled")
      setStep("overview")
    } catch (error) {
      toast.error("Failed to disable two-factor authentication")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!confirm("This will invalidate your current backup codes. Make sure to save the new ones.")) {
      return
    }

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newBackupCodes = generateBackupCodes()
      const newSettings = { ...settings, backupCodes: newBackupCodes }
      
      setSettings(newSettings)
      if (user?.id) {
        await UserSettingsService.save2FASettings(user.id, newSettings)
      }
      
      toast.success("New backup codes generated")
    } catch (error) {
      toast.error("Failed to generate new backup codes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep("overview")
    setVerificationCode("")
    setPhoneNumber("")
    setQrCode("")
    setSecretKey("")
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Icons.shield className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      {settings.isEnabled ? (
        <div className="space-y-4">
          <Alert>
            <Icons.checkCircle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is <strong>enabled</strong> using{" "}
              {settings.method === "app" ? "authenticator app" : "SMS"}.
              {settings.lastUsed && (
                <span className="block mt-1 text-xs">
                  Last used: {new Date(settings.lastUsed).toLocaleDateString()}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setStep("backup-codes")}
              className="w-full justify-start"
            >
              <Icons.key className="mr-2 h-4 w-4" />
              View Backup Codes
            </Button>

            <Button
              variant="outline"
              onClick={handleRegenerateBackupCodes}
              disabled={isLoading}
              className="w-full justify-start"
            >
              <Icons.refresh className="mr-2 h-4 w-4" />
              Generate New Backup Codes
            </Button>

            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Disable Two-Factor Authentication
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert>
            <Icons.alertTriangle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is <strong>disabled</strong>. 
              Enable it to better protect your account.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={handleSetupApp}
              disabled={isLoading}
              className="w-full justify-start"
            >
              <Icons.smartphone className="mr-2 h-4 w-4" />
              Set up with Authenticator App
              <Badge variant="secondary" className="ml-auto">Recommended</Badge>
            </Button>

            <Button
              variant="outline"
              onClick={handleSetupSMS}
              disabled={isLoading}
              className="w-full justify-start"
            >
              <Icons.messageSquare className="mr-2 h-4 w-4" />
              Set up with SMS
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Authenticator apps are more secure than SMS</p>
            <p>• You'll need your phone to sign in</p>
            <p>• Backup codes will be provided for recovery</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderSetupApp = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Set up Authenticator App</h3>
        <p className="text-sm text-muted-foreground">
          Scan the QR code with your authenticator app
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-center space-y-4">
          {qrCode && (
            <div className="mx-auto w-48 h-48 border rounded-lg flex items-center justify-center bg-white">
              <img src={qrCode} alt="QR Code" className="w-40 h-40" />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Or enter this code manually:</Label>
            <div className="font-mono text-sm bg-muted p-2 rounded border">
              {secretKey}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-code">Enter verification code</Label>
          <Input
            id="verification-code"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStep("overview")}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleVerifyCode}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1"
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Enable
          </Button>
        </div>
      </div>
    </div>
  )

  const renderSetupSMS = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Set up SMS Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Enter your phone number to receive verification codes
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-number">Phone Number</Label>
          <Input
            id="phone-number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        {phoneNumber && (
          <div className="space-y-2">
            <Label htmlFor="sms-code">Enter verification code sent to your phone</Label>
            <Input
              id="sms-code"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setStep("overview")}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={phoneNumber && !verificationCode ? () => {
              toast.success("Verification code sent!")
              setVerificationCode("")
            } : handleVerifyCode}
            disabled={isLoading || !phoneNumber || (!!verificationCode && verificationCode.length !== 6)}
            className="flex-1"
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {!verificationCode ? "Send Code" : "Verify & Enable"}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Backup Codes</h3>
        <p className="text-sm text-muted-foreground">
          Save these codes in a safe place. You can use them to access your account if you lose your phone.
        </p>
      </div>

      <Alert>
        <Icons.alertTriangle className="h-4 w-4" />
        <AlertDescription>
          Each backup code can only be used once. Generate new codes if you run out.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2">
        {settings.backupCodes.map((code, index) => (
          <div
            key={index}
            className="font-mono text-sm bg-muted p-3 rounded border text-center"
          >
            {code}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setStep("overview")}
          className="flex-1"
        >
          Done
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const codesText = settings.backupCodes.join('\n')
            navigator.clipboard.writeText(codesText)
            toast.success("Backup codes copied to clipboard")
          }}
          className="flex-1"
        >
          <Icons.copy className="mr-2 h-4 w-4" />
          Copy Codes
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>
        
        {step === "overview" && renderOverview()}
        {step === "setup-app" && renderSetupApp()}
        {step === "setup-sms" && renderSetupSMS()}
        {step === "backup-codes" && renderBackupCodes()}
      </DialogContent>
    </Dialog>
  )
}