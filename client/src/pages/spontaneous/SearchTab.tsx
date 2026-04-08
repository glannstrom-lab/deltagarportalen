/**
 * Search Tab - Look up companies by organization number
 */
import { useState } from 'react'
import { Search, Building2, MapPin, Briefcase, Calendar, Plus, ExternalLink, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import {
  formatOrgNumber,
  isValidOrgNumber,
  getSniDescription,
  type BolagsverketCompany,
} from '@/services/bolagsverketApi'

export default function SearchTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<BolagsverketCompany | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { lookupCompany, addCompany, isCompanySaved } = useSpontaneousCompanies()

  const handleSearch = async () => {
    const query = searchQuery.trim()

    if (!query) {
      setSearchError('Ange ett organisationsnummer')
      return
    }

    if (!isValidOrgNumber(query)) {
      setSearchError('Ogiltigt format. Ange 10 siffror (t.ex. 5560747551 eller 556074-7551)')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSearchResult(null)

    try {
      const result = await lookupCompany(query)

      if (result) {
        setSearchResult(result)
      } else {
        setSearchError('Företaget hittades inte i Bolagsverkets register')
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchError('Något gick fel vid sökningen. Försök igen.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = async () => {
    if (!searchResult) return

    setIsSaving(true)
    try {
      await addCompany(searchResult.orgNumber)
      // Clear search after saving
      setSearchResult(null)
      setSearchQuery('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const alreadySaved = searchResult ? isCompanySaved(searchResult.orgNumber) : false

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary-500" />
          Sök företag
        </h2>

        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Ange ett organisationsnummer för att hämta information om ett företag.
          Du hittar organisationsnummer på{' '}
          <a
            href="https://allabolag.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline inline-flex items-center gap-1"
          >
            allabolag.se
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Organisationsnummer (t.ex. 556074-7551)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
              disabled={isSearching}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="min-w-[100px]"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Sök'
            )}
          </Button>
        </div>

        {searchError && (
          <p className="mt-3 text-sm text-red-500">{searchError}</p>
        )}
      </Card>

      {/* Search Result */}
      {searchResult && (
        <Card className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                <h3 className="text-xl font-semibold">{searchResult.name}</h3>
              </div>

              <p className="text-sm text-slate-500 mb-4">
                Org.nr: {formatOrgNumber(searchResult.orgNumber)}
                {searchResult.legalForm && ` • ${searchResult.legalForm}`}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Address */}
                {searchResult.address && (searchResult.address.street || searchResult.address.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Adress</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {searchResult.address.street && <span>{searchResult.address.street}<br /></span>}
                        {searchResult.address.postalCode} {searchResult.address.city}
                      </p>
                    </div>
                  </div>
                )}

                {/* Industry */}
                {searchResult.sniCodes && searchResult.sniCodes.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Bransch</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {searchResult.sniCodes.map(sni => (
                          <span key={sni.code} className="block">
                            {sni.description || getSniDescription(sni.code)}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                )}

                {/* Registration Date */}
                {searchResult.registrationDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Registrerat</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(searchResult.registrationDate).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Business Description */}
              {searchResult.businessDescription && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Verksamhet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {searchResult.businessDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div>
              <Button
                onClick={handleSave}
                disabled={isSaving || alreadySaved}
                variant={alreadySaved ? 'outline' : 'default'}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {alreadySaved ? 'Redan sparad' : 'Spara företag'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-medium mb-2">Tips för spontanansökningar</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
          <li>• Sök efter företag på <a href="https://allabolag.se" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">allabolag.se</a> för att hitta organisationsnummer</li>
          <li>• Välj företag som matchar din kompetens och dina intressen</li>
          <li>• Researcha företaget ordentligt innan du kontaktar dem</li>
          <li>• Anpassa din ansökan till varje företag – undvik generiska brev</li>
          <li>• Följ upp om du inte hört något inom 1-2 veckor</li>
        </ul>
      </Card>
    </div>
  )
}
