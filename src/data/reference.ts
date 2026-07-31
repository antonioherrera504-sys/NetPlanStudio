export type ReferenceKind = 'TCP' | 'UDP' | 'TCP/UDP' | 'IP Protocol' | 'EtherType' | 'ICMP' | 'ICMPv6'
export interface ReferenceEntry { id: string; number: string; name: string; kind: ReferenceKind; description: string; category: string }

export const REFERENCE_VERSION = '2026-07-31'
export const REFERENCE_SOURCES = [
  { name: 'IANA Service Name and Transport Protocol Port Number Registry', url: 'https://www.iana.org/assignments/service-names-port-numbers/' },
  { name: 'IANA Protocol Numbers', url: 'https://www.iana.org/assignments/protocol-numbers/' },
  { name: 'IANA IEEE 802 Numbers / EtherTypes', url: 'https://www.iana.org/assignments/ieee-802-numbers/' },
  { name: 'IANA ICMP Parameters', url: 'https://www.iana.org/assignments/icmp-parameters/' }
]

const services: ReferenceEntry[] = ([
  ['20-21','FTP','TCP','File Transfer Protocol data/control','file transfer'],['22','SSH','TCP','Secure shell and secure file transfer','remote access'],['23','Telnet','TCP','Unencrypted terminal access','remote access'],['25','SMTP','TCP','Simple Mail Transfer Protocol','email'],['53','DNS','TCP/UDP','Domain Name System','infrastructure'],['67-68','DHCPv4','UDP','Server and client bootstrap configuration','infrastructure'],['69','TFTP','UDP','Trivial File Transfer Protocol','file transfer'],['80','HTTP','TCP','Web traffic without transport encryption','web'],['88','Kerberos','TCP/UDP','Kerberos authentication','identity'],['110','POP3','TCP','Post Office Protocol v3','email'],['119','NNTP','TCP','Network News Transfer Protocol','messaging'],['123','NTP','UDP','Network Time Protocol','infrastructure'],['135','MS RPC','TCP/UDP','Microsoft RPC endpoint mapper','windows'],['137-139','NetBIOS','TCP/UDP','NetBIOS name, datagram, and session services','windows'],['143','IMAP','TCP','Internet Message Access Protocol','email'],['161-162','SNMP','UDP','Network management queries and traps','management'],['179','BGP','TCP','Border Gateway Protocol','routing'],['389','LDAP','TCP/UDP','Lightweight Directory Access Protocol','identity'],['443','HTTPS','TCP','HTTP over TLS','web'],['445','SMB','TCP','Microsoft Server Message Block','file sharing'],['465','SMTPS','TCP','Message submission over implicit TLS','email'],['500','IKE','UDP','IPsec key exchange','vpn'],['514','Syslog','UDP','System logging','management'],['515','LPD','TCP','Line Printer Daemon','printing'],['520','RIP','UDP','Routing Information Protocol','routing'],['546-547','DHCPv6','UDP','DHCPv6 client and server','infrastructure'],['587','Submission','TCP','Authenticated email submission','email'],['636','LDAPS','TCP','LDAP over TLS','identity'],['853','DNS over TLS','TCP','Encrypted DNS transport','infrastructure'],['993','IMAPS','TCP','IMAP over TLS','email'],['995','POP3S','TCP','POP3 over TLS','email'],['1194','OpenVPN','TCP/UDP','OpenVPN tunnel transport','vpn'],['1812-1813','RADIUS','UDP','RADIUS authentication and accounting','identity'],['1900','SSDP','UDP','Simple Service Discovery Protocol','discovery'],['2049','NFS','TCP/UDP','Network File System','file sharing'],['3306','MySQL','TCP','MySQL database service','database'],['3389','RDP','TCP/UDP','Remote Desktop Protocol','remote access'],['5060-5061','SIP','TCP/UDP','Session Initiation Protocol, clear/TLS','voice'],['5432','PostgreSQL','TCP','PostgreSQL database service','database'],['5900','VNC','TCP','Virtual Network Computing','remote access'],['6379','Redis','TCP','Redis database service','database'],['8080','HTTP alternate','TCP','Common alternate HTTP port','web'],['8443','HTTPS alternate','TCP','Common alternate HTTPS port','web']
] satisfies Array<[string,string,ReferenceKind,string,string]>).map((entry, index) => ({ id: `svc-${index}`, number: entry[0], name: entry[1], kind: entry[2], description: entry[3], category: entry[4] }))

const protocols: ReferenceEntry[] = ([
  ['1','ICMP','Control messages for IPv4'],['2','IGMP','Internet Group Management Protocol'],['4','IPv4','IPv4 encapsulation'],['6','TCP','Transmission Control Protocol'],['17','UDP','User Datagram Protocol'],['41','IPv6','IPv6 encapsulation'],['47','GRE','Generic Routing Encapsulation'],['50','ESP','IPsec Encapsulating Security Payload'],['51','AH','IPsec Authentication Header'],['58','IPv6-ICMP','ICMP for IPv6'],['89','OSPF','Open Shortest Path First'],['112','VRRP','Virtual Router Redundancy Protocol'],['132','SCTP','Stream Control Transmission Protocol']
] satisfies Array<[string,string,string]>).map(([number,name,description], index) => ({ id: `ip-${index}`, number, name, kind: 'IP Protocol', description, category: 'network layer' }))

const etherTypes: ReferenceEntry[] = ([
  ['0x0800','IPv4','Internet Protocol version 4'],['0x0806','ARP','Address Resolution Protocol'],['0x8100','802.1Q','VLAN-tagged frame'],['0x86DD','IPv6','Internet Protocol version 6'],['0x8847','MPLS unicast','MPLS unicast packet'],['0x8848','MPLS multicast','MPLS multicast packet'],['0x8863','PPPoE discovery','PPPoE discovery stage'],['0x8864','PPPoE session','PPPoE session stage'],['0x88CC','LLDP','Link Layer Discovery Protocol'],['0x888E','802.1X','EAP over LAN']
] satisfies Array<[string,string,string]>).map(([number,name,description], index) => ({ id: `eth-${index}`, number, name, kind: 'EtherType' as const, description, category: 'data link' }))

const icmp: ReferenceEntry[] = ([
  ['0','Echo reply','Reply to IPv4 echo request'],['3','Destination unreachable','IPv4 destination cannot be reached'],['5','Redirect','Suggest an alternate IPv4 route'],['8','Echo request','IPv4 reachability request'],['11','Time exceeded','TTL expired or fragment reassembly timed out'],['12','Parameter problem','Malformed IPv4 header parameter'],['128','Echo request','IPv6 reachability request'],['129','Echo reply','Reply to IPv6 echo request'],['133','Router solicitation','IPv6 router discovery solicitation'],['134','Router advertisement','IPv6 router discovery advertisement'],['135','Neighbor solicitation','IPv6 address resolution and DAD'],['136','Neighbor advertisement','IPv6 neighbor response'],['137','Redirect','IPv6 better-first-hop message']
] satisfies Array<[string,string,string]>).map(([number,name,description], index) => ({ id: `icmp-${index}`, number, name, kind: (Number(number) >= 128 ? 'ICMPv6' : 'ICMP') as ReferenceKind, description, category: 'control' }))

export const referenceEntries = [...services, ...protocols, ...etherTypes, ...icmp]

const matchesNumber = (entryNumber: string, query: string) => {
  const normalized = query.toLowerCase()
  if (entryNumber.toLowerCase() === normalized) return true
  if (/^\d+$/.test(normalized) && entryNumber.includes('-')) {
    const [start, end] = entryNumber.split('-').map(Number)
    const value = Number(normalized)
    return value >= start! && value <= end!
  }
  return false
}

export const searchReferences = (query: string, kinds: ReferenceKind[] = []) => {
  const needle = query.trim().toLowerCase()
  return referenceEntries.filter((entry) => (!kinds.length || kinds.includes(entry.kind)) && (!needle || matchesNumber(entry.number, needle) || [entry.number, entry.name, entry.kind, entry.description, entry.category].some((value) => value.toLowerCase().includes(needle))))
}
