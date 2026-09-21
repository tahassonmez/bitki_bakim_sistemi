-- CreateTable
CREATE TABLE "_StaffCustomerAssignment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffCustomerAssignment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StaffCustomerAssignment_B_index" ON "_StaffCustomerAssignment"("B");

-- AddForeignKey
ALTER TABLE "_StaffCustomerAssignment" ADD CONSTRAINT "_StaffCustomerAssignment_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffCustomerAssignment" ADD CONSTRAINT "_StaffCustomerAssignment_B_fkey" FOREIGN KEY ("B") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
