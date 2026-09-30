pnpm test:e2e                  # jalan di background (headless), paling cepat
pnpm test:e2e --headed         # browser terlihat, kamu bisa menonton test mengklik
pnpm test:e2e --ui             # mode UI: pilih test, lihat langkah demi langkah (paling enak untuk belajar)
pnpm exec playwright show-report   # buka laporan HTML hasil test terakhir


pnpm test          # mode watch: test jalan ulang setiap file disimpan
pnpm test run      # jalan sekali lalu selesai
