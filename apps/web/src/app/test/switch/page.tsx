'use client'

import { useState } from 'react'
import { Toggle, PriceInput } from '@siamo/ui'
import {
  WhatsAppLogo,
  Cattle,
  CoffeeBean,
  Corn,
  Farm,
  Harvester,
  Irrigation,
  Soil,
  Soybean,
  Tractor,
  Agronomist,
  Citrus,
} from '@siamo/ui/icons'

export default function SwitchTestPage() {
  const [on, setOn] = useState(false)
  const [price, setPrice] = useState<number | null>(null)

  return (
    <div className="bg-background min-h-screen space-y-6 p-8">
      <h1 className="text-foreground text-lg font-semibold">Component test</h1>

      <Toggle
        label="Preço negociável"
        description="Compradores poderão fazer contra-proposta"
        checked={on}
        onCheckedChange={setOn}
      />

      <Toggle label="Preço negociável (on)" checked={true} onCheckedChange={() => {}} />

      <PriceInput value={price} onChange={setPrice} ariaLabel="Preço" />

      <div className="flex items-center gap-4">
        <WhatsAppLogo size={24} className="text-foreground" />
        <WhatsAppLogo size={40} className="text-foreground" />
        <WhatsAppLogo size={24} className="text-[#25D366]" />
        <WhatsAppLogo size={40} className="text-[#25D366]" />
      </div>

      <div className="flex items-center gap-4">
        <Cattle size={24} className="text-foreground" />
        <Cattle size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <CoffeeBean size={24} className="text-foreground" />
        <CoffeeBean size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Corn size={24} className="text-foreground" />
        <Corn size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Farm size={24} className="text-foreground" />
        <Farm size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Harvester size={24} className="text-foreground" />
        <Harvester size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Irrigation size={24} className="text-foreground" />
        <Irrigation size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Soil size={24} className="text-foreground" />
        <Soil size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Soybean size={24} className="text-foreground" />
        <Soybean size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Tractor size={24} className="text-foreground" />
        <Tractor size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Agronomist size={24} className="text-foreground" />
        <Agronomist size={40} className="text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <Citrus size={24} className="text-foreground" />
        <Citrus size={40} className="text-foreground" />
      </div>
    </div>
  )
}
