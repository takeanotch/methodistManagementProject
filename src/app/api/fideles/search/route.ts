// // app/api/fideles/search/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { getFidelesDisponibles } from '@/actions/chef-departement'

// export async function GET(request: NextRequest) {
//   const searchParams = request.nextUrl.searchParams
//   const districtId = searchParams.get('districtId')
//   const q = searchParams.get('q')

//   if (!districtId || !q) {
//     return NextResponse.json([])
//   }

//   const fideles = await getFidelesDisponibles(parseInt(districtId), q)
//   return NextResponse.json(fideles)
// }

// app/api/fideles/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchFidelesDisponibles } from '@/actions/chef-departement'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const districtId = searchParams.get('districtId')

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  if (!districtId) {
    return NextResponse.json({ error: 'districtId est requis' }, { status: 400 })
  }

  try {
    const fideles = await searchFidelesDisponibles(parseInt(districtId), query)
    return NextResponse.json(fideles)
  } catch (error) {
    console.error('Erreur recherche API:', error)
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 })
  }
}