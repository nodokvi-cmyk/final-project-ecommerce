export default function Footer() {
  return (
    <footer>
      <div className="container footer">
        <div>
          <div className="logo">SHOPLY</div>
          <p>Simple shopping, secure checkout, and fast order management.</p>
        </div>
        <div>
          <strong>Shop</strong>
          <p>Products</p>
          <p>Cart</p>
          <p>Orders</p>
        </div>
        <div>
          <strong>Account</strong>
          <p>Profile</p>
          <p>Sign in</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Shoply</div>
    </footer>
  );
}
