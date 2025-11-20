"use client"

import {useRef} from "react"
import {CreateCompanyForm} from "./CreateCompanyForm"
import {CompaniesList, type CompaniesListRef} from "./CompaniesList"

export function CompaniesPageClient() {
  const companiesListRef = useRef<CompaniesListRef>(null)

  const handleCompanyCreated = () => {
    // Atualizar a lista quando uma company for criada
    companiesListRef.current?.refresh()
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CreateCompanyForm onCompanyCreated={handleCompanyCreated} />
      <CompaniesList ref={companiesListRef} />
    </div>
  )
}
