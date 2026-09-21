-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessageRead" (
    "staffId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessageRead_pkey" PRIMARY KEY ("staffId")
);

-- CreateIndex
CREATE INDEX "GroupMessage_createdAt_idx" ON "GroupMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessageRead" ADD CONSTRAINT "GroupMessageRead_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
