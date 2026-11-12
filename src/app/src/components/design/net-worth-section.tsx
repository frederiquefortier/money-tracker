import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { NetWorthBackLink } from '#/components/net-worth/back-link'
import { HubCard, TotalCard } from '#/components/net-worth/hub-cards'

export function NetWorthSection() {
  return (
    <GallerySection id="net-worth" title="Net worth">
      <Specimen name="TotalCard, HubCard" source="net-worth/hub-cards.tsx">
        <div className="flex w-full max-w-lg flex-col gap-3">
          <TotalCard total="48250.5" currency="CAD" converted />
          <HubCard
            to="/net-worth/accounts"
            icon="wallet"
            title="Accounts"
            detail="3 accounts"
            total="12400"
            currency="CAD"
            converted={false}
          />
          <HubCard
            to="/net-worth/accounts"
            icon="wallet"
            title="Missing rate"
            detail="1 account"
            total={null}
            currency="CAD"
            converted
          />
        </div>
      </Specimen>
      <Specimen name="NetWorthBackLink" source="net-worth/back-link.tsx">
        <NetWorthBackLink />
      </Specimen>
    </GallerySection>
  )
}
