import type { Brand, FaqItem } from '@/lib/types';
import { Icon } from './Icons';
import { GoLink, OpenCartButton } from './GoLink';

/* Server components: no client JavaScript beyond the small links inside. */

export function DeliveryPromise() {
  return (
    <section className="promise" id="delivery" aria-labelledby="promise-title">
      <div className="promise-inner">
        <div className="promise-head">
          <p className="eyebrow">Delivery</p>
          <h2 className="section-title" id="promise-title">Chocolate hates heat. We planned for that.</h2>
        </div>
        <div className="temps">
          <div className="temp temp-hot">
            <p className="temp-label">A May afternoon in Dhaka</p>
            <p className="temp-num">36<span>°C</span></p>
          </div>
          <div className="temp temp-cool">
            <p className="temp-label">Our storeroom, all year</p>
            <p className="temp-num">17<span>°C</span></p>
          </div>
          <p className="temps-note">
            Chocolate starts to soften at about 28°C, so ours never gets near it. Cool storage, insulated boxes, and ice packs from March to October.
          </p>
        </div>
        <ul className="facts">
          <li className="fact">
            <h3>The real best-before date</h3>
            <p>Every listing shows the date printed on the stock we have now.</p>
            <p className="inkjet" aria-label="Example: best before September 2027">BEST BEFORE 09 2027 · LOT 26C14</p>
          </li>
          <li className="fact">
            <h3>Tree-ripened mangoes</h3>
            <p>Picked when ready in Rajshahi and Chapainawabganj. No carbide, no formalin, ever.</p>
          </li>
          <li className="fact">
            <h3>Pay how you like</h3>
            <p>Cash on delivery, bKash, Nagad or card. Choose cash and you pay nothing until it’s at your door.</p>
          </li>
          <li className="fact">
            <h3>Quick in Dhaka</h3>
            <p>Delivered within 24 hours inside Dhaka, and in 2–4 days everywhere else in Bangladesh.</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="faq-inner">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 className="section-title" id="faq-title">Before you order</h2>
          <p className="faq-contact">Anything else? Message us on WhatsApp and a real person replies, usually within the hour.</p>
        </div>
        <div className="faq-list">
          {items.map((f) => (
            <details className="faq-item" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer({ brand }: { brand: Brand }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <a className="logo logo-footer" href="#top" aria-label={`${brand.name}, back to top`}>
            <Icon name="rosette" className="logo-mark" />
            <span className="logo-word">{brand.name}</span>
          </a>
          <p>Chocolate, always.<br />The rest, in season.</p>
          <p className="footer-bn" lang="bn">ছয় ঋতুর চকলেট</p>
        </div>
        <nav className="footer-col" aria-label="Shop">
          <h3>Shop</h3>
          <GoLink to="premium">Premium chocolate</GoLink>
          <GoLink to="seasonal">Seasonal</GoLink>
          <a href="#year">The year at {brand.name}</a>
        </nav>
        <nav className="footer-col" aria-label="Help">
          <h3>Help</h3>
          <a href="#delivery">Delivery</a>
          <a href="#faq">Questions</a>
          <OpenCartButton>Your cart</OpenCartButton>
        </nav>
        <div className="footer-col">
          <h3>Talk to us</h3>
          <a href={`tel:${brand.phone.replace(/[^\d+]/g, '')}`}>{brand.phone}</a>
          <a href={brand.links.whatsapp}>WhatsApp</a>
          <a href={brand.links.facebook}>Facebook</a>
          <a href={brand.links.instagram}>Instagram</a>
        </div>
      </div>
      <p className="footer-base">
        <span>© {new Date().getFullYear()} {brand.name}</span>
        <span>{brand.city}</span>
      </p>
    </footer>
  );
}
