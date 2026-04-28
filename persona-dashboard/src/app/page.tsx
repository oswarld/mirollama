import db from '@/lib/db'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Persona {
  uuid: string
  persona: string
  age: number
  sex: string
  occupation: string
  district: string
  province: string
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page) || 1
  const query = (resolvedParams.query as string) || ''
  const limit = 20
  const offset = (page - 1) * limit

  // Prepare SQLite query
  let dataQuery = `SELECT uuid, persona, age, sex, occupation, district, province FROM personas`
  let countQuery = `SELECT count(*) as total FROM personas`
  const params: any[] = []

  if (query) {
    const searchFilter = ` WHERE persona LIKE ? OR occupation LIKE ? OR province LIKE ?`
    dataQuery += searchFilter
    countQuery += searchFilter
    params.push(`%${query}%`, `%${query}%`, `%${query}%`)
  }

  dataQuery += ` LIMIT ? OFFSET ?`
  const dataParams = [...params, limit, offset]

  const personas = db.prepare(dataQuery).all(...dataParams) as Persona[]
  const { total } = db.prepare(countQuery).get(...params) as { total: number }
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">페르소나 관리자</h1>
            <p className="text-gray-500 mt-1">로컬 SQLite 기반 (Air-gapped) 시뮬레이션 대상자 목록</p>
          </div>
          
          {/* Search Form */}
          <form method="GET" action="/" className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              name="query" 
              defaultValue={query}
              placeholder="직업, 지역, 키워드 검색..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-medium">연령/성별</th>
                  <th className="px-6 py-4 font-medium">직업</th>
                  <th className="px-6 py-4 font-medium">지역</th>
                  <th className="px-6 py-4 font-medium w-full">페르소나 요약</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {personas.length > 0 ? (
                  personas.map((p) => (
                    <tr key={p.uuid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                          {p.age}세 / {p.sex === 'male' ? '남성' : p.sex === 'female' ? '여성' : p.sex}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{p.occupation || '-'}</td>
                      <td className="px-6 py-4 text-gray-700">{p.province} {p.district}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 truncate max-w-lg" title={p.persona}>
                          {p.persona}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      조건에 맞는 페르소나가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-500">
              총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>명 중{' '}
              <span className="font-medium text-gray-900">{offset + 1}</span>-
              <span className="font-medium text-gray-900">{Math.min(offset + limit, total)}</span>명
            </div>
            
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link 
                  href={`/?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
                  className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  이전
                </Link>
              )}
              {page < totalPages && (
                <Link 
                  href={`/?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
                  className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  다음
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
