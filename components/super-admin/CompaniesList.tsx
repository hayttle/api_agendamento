"use client"

import {useEffect, useState, useImperativeHandle, forwardRef} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {LoadingSpinner} from "@/components/layout/LoadingSpinner"
import {ErrorAlert} from "@/components/layout/ErrorAlert"

interface Company {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface CompaniesListRef {
  refresh: () => Promise<void>
}

export const CompaniesList = forwardRef<CompaniesListRef>((props, ref) => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/v1/companies")
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar companies")
        return
      }

      setCompanies(data.data || [])
    } catch (err) {
      setError("Erro ao carregar companies")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useImperativeHandle(ref, () => ({
    refresh: fetchCompanies
  }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>Lista de todas as companies</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Companies</CardTitle>
        <CardDescription>Lista de todas as companies</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorAlert message={error} />
        ) : companies.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma company cadastrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.slug}</TableCell>
                  <TableCell>{new Date(company.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
})

CompaniesList.displayName = "CompaniesList"
