'use client';

export function FinancingBanner() {
  return (
    <section className="bg-white px-[18px] py-[20px] lg:px-[28px] lg:py-[28px]">
      <div className="rounded-[12px] bg-[#13454d] px-[15px] py-[21px]">
        {/* Zinia logo */}
        <div className="mb-[11px]">
          <img
            src="/images/zinia-logo.png"
            alt="Zinia"
            className="h-[40px] w-[77px] object-cover"
          />
        </div>

        <h3 className="mb-[11px] text-[21px] font-medium text-white w-[349px] lg:w-auto">
          Low-interest financing
        </h3>

        <p className="mb-[11px] text-[13px] text-white leading-normal w-[349px] lg:w-auto">
          Pay in installments with{' '}
          <span className="font-bold">Zinia by Santander</span>
          . When checking out, you can choose the installment option that suits you best.
        </p>

        <button className="rounded-[50px] border-[0.7px] border-white bg-white px-[12px] py-[7px] text-[12px] text-[#13454d]">
          Learn more
        </button>
      </div>
    </section>
  );
}
