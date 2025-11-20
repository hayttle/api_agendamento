"use client"

import {useState, useEffect, Suspense} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {createClient} from "@/lib/supabase/client"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {ErrorAlert} from "@/components/layout/ErrorAlert"
import {LoadingSpinner} from "@/components/layout/LoadingSpinner"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // O Supabase passa o token no hash da URL quando redireciona
    const hash = window.location.hash
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get("access_token")
      const type = hashParams.get("type")

      if (accessToken && type === "invite") {
        handleTokenFromHash(accessToken)
        return
      }
    }

    // Fallback: tentar pegar da query string (caso venha como query param)
    const token = searchParams.get("token")
    const type = searchParams.get("type")

    if (token && type === "invite") {
      verifyToken(token)
      return
    }

    // Se não encontrou token em nenhum lugar
    setError("Link de convite inválido ou expirado")
    setVerifying(false)
  }, [searchParams])

  const handleTokenFromHash = async (accessToken: string) => {
    try {
      const supabase = createClient()

      // Extrair refresh_token do hash também
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.substring(1))
      const refreshToken = hashParams.get("refresh_token") || ""

      // Estabelecer a sessão com o token do hash
      const {
        data: {session},
        error: sessionError
      } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (sessionError || !session || !session.user) {
        setError("Link de convite inválido ou expirado")
        setVerifying(false)
        return
      }

      setEmail(session.user.email || null)
      setVerifying(false)
    } catch (err) {
      setError("Erro ao verificar convite")
      setVerifying(false)
    }
  }

  const verifyToken = async (token: string) => {
    try {
      const supabase = createClient()

      // Verificar o token e obter o email
      const {data, error: verifyError} = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "invite"
      })

      if (verifyError || !data.user) {
        setError("Link de convite inválido ou expirado")
        setVerifying(false)
        return
      }

      setEmail(data.user.email || null)
      setVerifying(false)
    } catch (err) {
      setError("Erro ao verificar convite")
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Verificar se o usuário já está autenticado (token do hash)
      const {
        data: {user: currentUser},
        error: getUserError
      } = await supabase.auth.getUser()

      if (getUserError || !currentUser) {
        // Se não estiver autenticado, tentar verificar o token da query string
        const token = searchParams.get("token")

        if (!token) {
          setError("Token não encontrado")
          setLoading(false)
          return
        }

        // Aceitar o convite e definir a senha
        const {data: verifyData, error: verifyError} = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "invite"
        })

        if (verifyError || !verifyData.user) {
          setError("Erro ao verificar convite. Tente novamente.")
          setLoading(false)
          return
        }

        // Atualizar a senha do usuário
        const {error: updateError} = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) {
          setError(updateError.message || "Erro ao definir senha")
          setLoading(false)
          return
        }
      } else {
        // Usuário já autenticado (token do hash), apenas atualizar a senha
        const {error: updateError} = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) {
          setError(updateError.message || "Erro ao definir senha")
          setLoading(false)
          return
        }
      }

      // Fazer logout para forçar novo login
      await supabase.auth.signOut()

      // Redirecionar para login com mensagem de sucesso
      router.push("/login?message=Senha definida com sucesso! Faça login para continuar.")
    } catch (err) {
      setError("Erro ao processar convite. Tente novamente.")
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex justify-center py-8">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            {email ? `Defina sua senha para ${email}` : "Defina sua senha para completar o cadastro"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Definindo senha...
                </>
              ) : (
                "Definir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex justify-center py-8">
              <LoadingSpinner />
            </CardContent>
          </Card>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
